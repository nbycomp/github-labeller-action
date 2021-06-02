# github-labeller-action

Automatically add a label when a pull request is created, based on the branch prefix.

## Testing

The action can be tested using [act](https://github.com/nektos/act):

```sh
act -s GITHUB_TOKEN="$GITHUB_TOKEN" -e event.json pull_request
```
