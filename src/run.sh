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
# Split the string into lines and print each line separately.
while IFS= read -r line; do
    # If the line starts with #, print it in gray.
    if [[ $line == \#* ]];then
        echo -e "\e[90m$line\e[0m"
    else
    # Otherwise, print in green.
        echo -e "\e[32m$line\e[0m"
    fi
done <<< "$result"

# 3. Offer to run the command.

# if all lines start with #, then don't run the command
if [ -z "$(echo "$result" | grep -v '^#')" ];then
    # echo "All lines start with #, so not running the command."
    echo
    exit 0
fi

echo
read -p "↑ Run? [Y/n] " -n 1 -r response
if [[ $response =~ ^[Yy]$ ]];then
    # move the cursor to the beginning of the line
    echo -en "\r"
    echo -e "\e[90mRunning...      \e[0m"
    # log both the command and the result
    # echo "$command" >> ./gpt.log
    # echo "$result" >> ./gpt.log
    
    eval "$result"
    # run the command, but keep the output with the correct formatting
    # eval "$result" | while IFS= read -r line; do
    #     echo -e "$line"
    #     # echo -e "$line" >> ./gpt.log
    # done
else
    # echo "Not running."
    echo
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