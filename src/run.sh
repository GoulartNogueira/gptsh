# You can "install" this script by running:
# alias gpt='bash $(pwd)/src/run.sh'

# 1. Call the function in ./index.js, pass the query string as an argument. Set the result to a variable.
# 2. Receive the command from the function and show it to the user.
# 3. Offer to run the command. (Y/n)
# 4. If the user accepts, run it.

# 1. Locate the index.js file and run it, forwarding the rest of the string as arguments.
command="$(dirname "$0")/index.js --ask false $@"
# echo "calling: $command"
# if command fails, interrupt
result="$(eval "$command")" || exit 1

# 2. Show the command to the user.
echo "$result"

# 3. Offer to run the command.

# if all lines start with #, then don't run the command
if [ -z "$(echo "$result" | grep -v '^#')" ];then
    # echo "All lines start with #, so not running the command."
    exit 0
fi

read -p "Run command? [Y/n] " -n 1 -r response
if [[ $response =~ ^[Yy]$ ]];then
    echo "Running..."
    eval "$result"
else
    # echo "Not running."
    exit 0
fi

# https://stackoverflow.com/questions/226703/how-do-i-prompt-for-input-in-a-linux-shell-script
# So instead, use the following:
# printf 'Run command? [y/N] '
# old_stty_cfg=$(stty -g)

# stty raw -echo ; answer=$(head -c 1) ; stty $old_stty_cfg
# if [ "$answer" != "${answer#[Yy]}" ];then
#     echo "Running..."
#     eval "$result"
# fi