#!/usr/bin/env python3
"""
Commit files through GitHub's GraphQL createCommitOnBranch mutation.

This is the only way to produce a commit that carries a Verified badge
without holding a signing key: GitHub builds the commit server-side and
signs it as it does so. Measured on this repository, the result is
committer "GitHub <noreply@github.com>", verified: true, reason: valid.

Authorship follows the token, not this script — a personal access token
belonging to the repository owner produces a commit authored by them.

Environment:
  GH_TOKEN          token with contents:write
  HEADLINE          commit message (optional)
  GITHUB_REPOSITORY owner/repo   (set by Actions)
  GITHUB_REF_NAME   branch       (set by Actions)
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

API = 'https://api.github.com/graphql'
MUTATION = (
    'mutation($i:CreateCommitOnBranchInput!){'
    'createCommitOnBranch(input:$i){commit{oid url}}}'
)


def gql(token, variables):
    body = json.dumps({'query': MUTATION, 'variables': variables}).encode()
    req = urllib.request.Request(API, data=body, method='POST', headers={
        'Authorization': 'bearer ' + token,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-publish',
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            payload = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit('GraphQL HTTP %s: %s' % (e.code, e.read().decode()[:400]))
    if payload.get('errors'):
        sys.exit('GraphQL error: %s' % json.dumps(payload['errors'])[:500])
    return payload['data']['createCommitOnBranch']['commit']


def branch_head(token, repo, branch):
    """Current tip of a branch, which the mutation needs to guard against races."""
    url = 'https://api.github.com/repos/%s/git/ref/heads/%s' % (repo, branch)
    req = urllib.request.Request(url, headers={
        'Authorization': 'bearer ' + token,
        'User-Agent': 'portfolio-publish',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['object']['sha']


def tracked_files():
    out = subprocess.check_output(['git', 'ls-files']).decode().splitlines()
    return [p for p in out if p and os.path.isfile(p)]


def changed(paths):
    """Only commit files git actually sees as modified or new."""
    out = []
    for p in paths:
        if not os.path.isfile(p):
            print('skip (missing): %s' % p)
            continue
        rc = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', p]).returncode
        untracked = subprocess.run(
            ['git', 'ls-files', '--error-unmatch', p],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode != 0
        if rc != 0 or untracked:
            out.append(p)
        else:
            print('skip (unchanged): %s' % p)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--branch', help='target branch (default: the current ref)')
    ap.add_argument('--all', action='store_true',
                    help='send every git-tracked file, not just changed ones')
    args = ap.parse_args()

    token = os.environ.get('GH_TOKEN')
    repo = os.environ.get('GITHUB_REPOSITORY')
    branch = args.branch or os.environ.get('GITHUB_REF_NAME')
    if not (token and repo and branch):
        sys.exit('GH_TOKEN, GITHUB_REPOSITORY and a target branch are required')

    if args.all:
        todo = tracked_files()
        print('sending %d tracked files to %s' % (len(todo), branch))
    else:
        if not args.paths:
            sys.exit('usage: commit-verified.py <path> [path...]  |  --all')
        todo = changed(args.paths)

    if not todo:
        print('nothing changed — no commit needed')
        return 0

    additions = []
    for p in todo:
        with open(p, 'rb') as f:
            additions.append({
                'path': p.replace(os.sep, '/'),
                'contents': base64.b64encode(f.read()).decode(),
            })

    head = branch_head(token, repo, branch)
    commit = gql(token, {'i': {
        'branch': {'repositoryNameWithOwner': repo, 'branchName': branch},
        'message': {'headline': os.environ.get('HEADLINE') or 'chore: publish content'},
        'expectedHeadOid': head,
        'fileChanges': {'additions': additions},
    }})

    print('committed %s' % commit['oid'])
    print(commit['url'])
    with open(os.environ.get('GITHUB_ENV', os.devnull), 'a') as f:
        f.write('PUBLISHED_SHA=%s\n' % commit['oid'])
    return 0


if __name__ == '__main__':
    sys.exit(main())
