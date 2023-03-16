#!/usr/bin/env node

//--- Import dependencies.
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const uniq = require('lodash/uniq')
const complete = require('./complete')
const buildConfig = require('./buildConfig')
const buildPrompt = require('./buildPrompt')

//--- Parse argv arguments using 'yargs' package.
const argv = yargs(hideBin(process.argv))
	.usage('Usage: $0 <input> [options]')
	.example('$0 List all files of this directory | bash')
	.example('$0 Install the lodash package --secret <YOUR_SECRET_KEY> | bash')
	.example('$0 Delete the root directory --engine ada')
	.example('$0 Add remote from github with name shorwood/gptsh --max-tokens 32')
	.option('secret', { type: 'string', alias: 's', description: 'OpenAI API key for authentication' })
	.option('engine', { type: 'string', alias: 'e', description: 'ID of the engine to use' })
	.option('tokens', { type: 'number', alias: 't', description: 'Maximum number of tokens to consume', default: 100 })
	.option('temperature', { type: 'number', description: 'Higher values means the model will take more risks', default: 0.0 })
	.option('platform', { type: 'string', alias: 'p', description: 'Platform of the command to output' })
	.option('n', { type: 'number', description: 'Number of completions to generate' })
	.demandCommand()
	.help()
	.argv

//--- Build the configuration object.
const appConfig = buildConfig({
	engineId: argv.engine,
	secret: argv.secret,
	max_tokens: argv.tokens,
	temperature: argv.temperature,
	n: argv.n,
	platform: argv.platform
})

//--- Build the prompt string.
const prompt = buildPrompt(argv._.join(' '), appConfig)

//--- Compute the apporpirate shell command and output it.
complete(prompt, appConfig).then(outputs => {
	// Check if the output is undefined.
	if (outputs === undefined) {
		console.error('No output was returned.')
		process.exit(1)
	}
	// replace '$ ' if it is at the beginning of a line
	const result = outputs[0].replace(/^\$ /gm, '')
	console.log(result)
	askRunCommand(result)
})

//--- Offer to run the command. If the user accepts, run it.
function askRunCommand(command) {
	// Asks if the user wants to run the command.
	const readline = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout
	})
	const question = 'Run command? [Y/n] '
	readline.question(question, answer => {
		if (answer === '' || answer.toLowerCase() === 'y') {
			// remove the last line printed
			process.stdout.moveCursor(0, -1)
			process.stdout.clearLine()
			console.log('Running...')

			// run the command
			const { exec } = require('child_process')
			exec(command, (err, stdout, stderr) => {
				if (err) {
					console.error(err)
					return
				}
				console.log(stdout)
			})
		}
		readline.close()
	})
}
