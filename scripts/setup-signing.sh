#!/usr/bin/env bash
#
# Turn on verified commit signing for this account, and optionally re-sign
# the history that already exists.
#
# Why this script and not a signed commit from CI: a "Verified" badge means
# GitHub checked a signature made by a key that belongs to YOU. Only you can
# hold that private key. No tool, bot or CI job can produce it on your behalf
# without becoming a key you do not control — which is exactly what you would
# not want on a security repository.
#
# Usage:  bash scripts/setup-signing.sh
#
set -euo pipefail

KEY="${HOME}/.ssh/id_ed25519"
EMAIL="$(git config user.email || true)"

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$1"; }

say "1/4  SSH key"
if [[ -f "${KEY}" ]]; then
  echo "    Using existing key: ${KEY}"
else
  echo "    No key at ${KEY} — creating one."
  ssh-keygen -t ed25519 -C "${EMAIL:-$(whoami)@$(hostname)}" -f "${KEY}" -N ""
fi

say "2/4  Git configuration"
git config --global gpg.format ssh
git config --global user.signingkey "${KEY}.pub"
git config --global commit.gpgsign true
git config --global tag.gpgsign true
echo "    gpg.format      = ssh"
echo "    user.signingkey = ${KEY}.pub"
echo "    commit.gpgsign  = true"

say "3/4  Add this PUBLIC key to GitHub as a SIGNING key"
cat <<MSG
    Open:  https://github.com/settings/ssh/new
    Title: anything you like
    Key type: *** Signing Key ***   <-- not "Authentication Key"

    If you already added this same key for authentication, you must add it a
    SECOND time with type "Signing Key". An auth key alone will not produce a
    Verified badge.

    Public key to paste:

MSG
cat "${KEY}.pub"
echo

read -r -p "    Added it on GitHub? Press Enter to continue, or Ctrl-C to stop. "

say "4/4  Re-sign existing commits (optional)"
cat <<'MSG'
    Every NEW commit is signed from now on. To also turn the commits that
    already exist green, rewrite them with your signature:

        git rebase --root --exec 'git commit --amend --no-edit -S'
        git push --force-with-lease

    This rewrites history. It is safe on a branch only you work on — which is
    the case here — but do not run it on a branch others have pulled.
MSG

say "Done. Verify with:  git log --show-signature -1"
