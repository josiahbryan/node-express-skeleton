import React from 'react';

import styles from './UserRegistration.module.scss';

import Card from '@material-ui/core/Card';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';


export default function UserRegistration(props) {
	const [ emailError, setEmailError ]       = React.useState(false);
	const [ passwordError, setPasswordError ] = React.useState(false);
	const [ email, setEmail ]       = React.useState("");
	const [ password, setPassword ] = React.useState("");
	const [ isLoading, setIsLoading ] = React.useState(false);
	const [ error, setError ] = React.useState("");

	const handleEmail = event => {
		const str = event.target.value;
		setEmail(str);

		// Specs require valid email less than 31 characters long
		if(!str ||
			str.length > 30 ||
		   // Borrowed from https://www.regextester.com/19
		   !str.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
			setEmailError(true);
		} else {
			setEmailError(false);
		}
	}

	const handlePassword = event => {
		const str = event.target.value;
		setPassword(str);

		// Specs require password to be between 6 and 30 characters
		if(!str ||
			str.length < 6 ||
			str.length > 30) {
			setPasswordError(true);
		} else {
			setPasswordError(false);
		}
	}

	const handleSignup = async () => {
		const data = {
			email,
			password
		};

		// Example POST method implementation
		// from https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
		async function postData(url = '', data = {}) {
			// Default options are marked with *
			const response = await fetch(url, {
				method: 'POST', // *GET, POST, PUT, DELETE, etc.
				mode: 'cors', // no-cors, *cors, same-origin
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'same-origin', // include, *same-origin, omit
				headers: {
					'Content-Type': 'application/json'
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
				redirect: 'follow', // manual, *follow, error
				referrerPolicy: 'no-referrer', // no-referrer, *client
				body: JSON.stringify(data) // body data type must match "Content-Type" header
			});
			return await response.json(); // parses JSON response into native JavaScript objects
		}

		setIsLoading(true);
		const response = await postData('http://localhost:9090/users/', data);

		setIsLoading(false);
		if(response.success === false) {
			const msg = response.message.errmsg || response.message;
			return setError("Registration problem: " + msg);
		} 

		alert("Welcome, " + response.email + "! You've successfully registered as a new user #" + response._id + "!");
		window.location.reload(); // clear form and reset state
	}
	
	return (<div className={styles.root}>
		<Card className={styles.regCard}>
			<CardContent>
				<Typography variant="h1">User Registration</Typography>

				<form className={styles.regForm} noValidate autoComplete="off">
					<TextField 
						id="email" 
						type="email" 
						label="Your email"
						error={emailError}
						helperText={emailError ? "Invalid email address" : "We won't spam you, we promise!"}
						defaultValue={email}
						onChange={handleEmail}
					/>

					<TextField 
						id="password" 
						type="password" 
						label="Choose a Password"
						error={passwordError}
						helperText={
							passwordError ? "Invalid password" : 
							password ? "✔️Looks good" : 
							"Should be between 6 and 30 characters"
						}
						defaultValue={password}
						onChange={handlePassword}
					/>

					<Button color="primary" disabled={isLoading} onClick={handleSignup}>Sign up</Button>
					{error ? <>
						<div className={styles.error}>
							{error}
						</div>
					</> : ""}
				</form>

			</CardContent>
		</Card>
	</div>)
}