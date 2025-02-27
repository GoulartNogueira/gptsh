#!/usr/bin/env node

//--- Import dependencies.
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const complete = require('./complete')
const buildConfig = require('./buildConfig')
const buildPrompt = require('./buildPrompt')
const execa = require('execa')

//--- Parse argv arguments using 'yargs' package.
const argv = yargs(hideBin(process.argv))
	.usage('Usage: $0 <input> [options]')
	.example('$0 "What is the command to list all files of this directory? --ask false | bash')
	.example('$0 Install the lodash package --secret <YOUR_SECRET_KEY> | bash')
	.example('$0 Delete the root directory --engine ada')
	.example('$0 Add remote from github with name shorwood/gptsh --max-tokens 32')
	.option('secret', { type: 'string', alias: 's', description: 'OpenAI API key for authentication' })
	.option('engine', { type: 'string', alias: 'e', description: 'ID of the engine to use' })
	.option('tokens', { type: 'number', alias: 't', description: 'Maximum number of tokens to consume', default: 100 })
	.option('temperature', { type: 'number', description: 'Higher values means the model will take more risks', default: 0.0 })
	.option('platform', { type: 'string', alias: 'p', description: 'Platform of the command to output' })
	.option('n', { type: 'number', description: 'Number of completions to generate' })
	// option to offer to run the command
	.option('ask', { type: 'boolean', alias: 'a', description: 'Ask if the user wants to run the command', default: true })
	// option to run the command without asking (CAUTION: dangerous)
	.option('force', { type: 'boolean', alias: 'f', description: 'CAUTION: Run the command without asking', default: false })
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

//--- Compute the appropriate shell command and output it.
complete(prompt, appConfig).then(outputs => {
	// {
	// 	"id": "chatcmpl-123",
	// 	"object": "chat.completion",
	// 	"created": 1677652288,
	// 	"choices": [{
	// 	  "index": 0,
	// 	  "message": {
	// 		"role": "assistant",
	// 		"content": "\n\nHello there, how may I assist you today?",
	// 	  },
	// 	  "finish_reason": "stop"
	// 	}],
	// 	"usage": {
	// 	  "prompt_tokens": 9,
	// 	  "completion_tokens": 12,
	// 	  "total_tokens": 21
	// 	}
	//   }
	  
	// Check if the output is undefined.
	if (outputs === undefined) {
		console.error('No output was returned.')
		process.exit(1)
	}
	console.log(outputs.usage)
	// replace '$ ' if it is at the beginning of a line
	let result = outputs.choices[0].message.content.replace(/^\$ /gm, '')
	// remove the last line, if it is empty
	if (result.endsWith('\n')) {
		result = result.slice(0, -1)
	}
	console.log(result)
	if (argv.ask) {
		// ask the user if they want to run the command
		askRunCommand(result)
	}
	if (argv.force) {
		// run the command without asking
		runCommand(result)
	}
}).
	catch(err => {
		console.error(err.message)
		// import and run getSecret() from ./complete.js

		// get the secret from the user
		const getSecret = require('./complete')
		//   code: 'invalid_api_key'
		if (err.code === 'invalid_api_key') {
			getSecret().then(secret => {
				console.log("Ok, got the secret. You can now run the command again.")
			})
				.finally(() => {
					// terminate the program
					process.exit(0)
				})
		}
		else {
			console.error(err)
			process.exit(1)
		}
	})

//--- Offer to run the command. If the user accepts, run it.
function askRunCommand(command) {
	// Asks if the user wants to run the command.
	// TODO
	// if all lines start with #, then theres nothing to be run.
	if (command.split('\n').every(line => line.startsWith('#'))) {
		// console.log('No command to run.')
		// terminate the program
		process.exit(0)
	}

	const prompts = require('prompts');
	(async () => {
		const response = await prompts({
			type: 'confirm',
			name: 'value',
			message: 'Run command?',
			initial: true
		});
		if (response.value) {
			// remove the last line printed
			// process.stdout.moveCursor(0, -1)
			// process.stdout.clearLine()
			// console.log('Running...')

			// run the command
			runCommand(command)
		}
	}
	)()
}

async function runCommand(command) {
	// Run the command using 'execa' package.
	try {
		await execa.execaCommand(command, {stdio: 'inherit' })
	}
	catch (err) {
		console.error(err.message)
	}
}
