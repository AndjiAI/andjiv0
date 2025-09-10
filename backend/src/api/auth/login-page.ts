export const getLoginPageHTML = (authCode: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andji Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        
        .logo {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .status {
            background: #f0f0f0;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
        }
        
        .status.processing {
            background: #fff3cd;
            color: #856404;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .auth-code {
            font-family: monospace;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            word-break: break-all;
            font-size: 12px;
            margin-top: 10px;
            color: #666;
        }
        
        .instructions {
            margin-top: 20px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
            text-align: left;
        }
        
        .instructions h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .instructions p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        
        .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
            transition: background 0.3s;
        }
        
        .button:hover {
            background: #5a67d8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🤖</div>
        <h1>Andji CLI Login</h1>
        <div class="subtitle">AI Coding Assistant</div>
        
        <div class="status processing" id="status">
            <div class="spinner"></div>
            <p><strong>Processing authentication...</strong></p>
            <p style="margin-top: 10px;">Please wait while we set up your session</p>
        </div>
        
        <div class="instructions">
            <h3>What happens next?</h3>
            <p>1. We're creating your session</p>
            <p>2. Your CLI will automatically connect</p>
            <p>3. You can close this window when done</p>
        </div>
        
        <div class="auth-code">
            Auth Code: ${authCode.substring(0, 20)}...
        </div>
    </div>
    
    <script>
        // Simulate authentication process
        setTimeout(() => {
            const statusDiv = document.getElementById('status');
            statusDiv.className = 'status success';
            statusDiv.innerHTML = '<p><strong>✅ Authentication Successful!</strong></p><p style="margin-top: 10px;">You can now return to your terminal</p>';
            
            // Show close button
            const button = document.createElement('button');
            button.className = 'button';
            button.textContent = 'Close this window';
            button.onclick = () => window.close();
            statusDiv.appendChild(button);
        }, 2000);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            window.close();
        }, 10000);
    </script>
</body>
</html>
`