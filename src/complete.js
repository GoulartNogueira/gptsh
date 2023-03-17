
//--- Import dependencies.
const map = require('lodash/map')
const pick = require('lodash/pick')
const axios = require('axios')

//--- Create an axios instance to query to.
const openai = axios.create({
	baseURL: 'https://api.openai.com/v1',
	headers: { 'Content-Type': 'application/json' }
})

module.exports = async (prompt, config = {}) => {

	//--- Parse options.
	const engineId = config.engineId
	const options = pick(config, [
		'max_tokens', 'temperature', 'top_p',
		'n', 'stream', 'logprobs', 'echo',
		'stop', 'presence_penalty', 'frequency_penalty',
		'best_of', 'logit_bias'
	])
	const secret = await getSecret(config.secret)
	//--- Set OpenAI Secret API Key.
	openai.defaults.headers.common['Authorization'] = `Bearer ${secret}`

	//--- Query the GPT-3 API.
	return await openai.post(`/engines/${engineId}/completions`, { prompt, ...options })
		.then(res => map(res.data.choices, 'text'))
		.catch(err => {
			if (err?.response?.data?.error) {
				//   code: 'invalid_api_key'
				if (err.response.data.error.code === 'invalid_api_key') {
					throw err.response.data.error
				}
				else {
					console.error(err.response.data.error)
				}
			} else {
				console.error(err)
			}
			process.exit(1)
		})
}


// get secret
const getSecret = async (secret) => {
	if (secret) {
		// console.log('Using secret from config file: ' + secret)
		return secret
	}

	const prompts = require('prompts');
	const response = await prompts({
		type: 'password',
		name: 'openai',
		message: 'Enter your OpenAI API key'
	});

	// Quick check if the api key is valid
	// the api key must: start with sk-, only contain alphanumeric characters (execpt -)
	if (!response.openai.startsWith('sk-')) {
		console.error('Invalid API key. Must start with sk-')
		process.exit(1)
	}
	if (!response.openai.match(/^[a-zA-Z0-9-]+$/)) {
		console.error('Invalid API key. Must only contain alphanumeric characters')
		process.exit(1)
	}
	
	const envFile = `${__dirname}/../.env`
	console.log("Saving API key at: " + envFile)
	const fs = require('fs');
	fs.appendFileSync(envFile, `\nOPENAI_SECRET_KEY=${response.openai}`);
	
	return response.openai
}
