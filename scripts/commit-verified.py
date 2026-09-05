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
    token = os.environ.get('GH_TOKEN')
    repo = os.environ.get('GITHUB_REPOSITORY')
    branch = os.environ.get('GITHUB_REF_NAME')
    if not (token and repo and branch):
        sys.exit('GH_TOKEN, GITHUB_REPOSITORY and GITHUB_REF_NAME are required')

    paths = sys.argv[1:]
    if not paths:
        sys.exit('usage: commit-verified.py <path> [path...]')

    todo = changed(paths)
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

    head = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
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
