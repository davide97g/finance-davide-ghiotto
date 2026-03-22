import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './style.css';
import { checkUserIsLoggedIn } from './api/auth';
import { Toaster } from 'sonner';

checkUserIsLoggedIn().catch(() => {});

ReactDOM.createRoot(document.getElementById('app')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
			<Toaster
				position="top-center"
				toastOptions={{
					className: 'custom-toast',
					style: {
						fontFamily: "'Montserrat', sans-serif",
					},
				}}
			/>
		</BrowserRouter>
	</React.StrictMode>
);
