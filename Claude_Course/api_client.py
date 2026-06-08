from dotenv import load_dotenv
import os
from anthropic import Anthropic

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")

client = Anthropic(api_key=api_key)

def add_user_message(messages, text):
	user_message = {"role": "user", "content": text}
	messages.append(user_message)

def add_assistant_message(messages, text):
	assistant_message = {"role": "assistant", "content": text}
	messages.append(assistant_message)

def chat(messages, system=None, temperature=1.0):
	params = {
		"model": "claude-sonnet-4-6",
		"max_tokens": 1024,
		"messages": messages,
		"temperature": temperature
	}

	if system:
		params["system"] = system

	message = client.messages.create(**params)
	return message.content[0].text

# Make an initial list of messages
messages = []

# Use a 'while True' loop to run the chatbot forever
while True:
	# Get user input
	user_input = input("> ")

	# Add user input to the list of messages
	add_user_message(messages, user_input)

	# Call Claude with the 'chat' function
	answer = chat(messages, temperature=0.0)

	# Add generated text to the list of messages
	add_assistant_message(messages, answer)
	print("------------")
	print(answer)
	print("------------")
