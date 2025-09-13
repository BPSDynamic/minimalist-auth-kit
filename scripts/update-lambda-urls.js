const fs = require('fs');
const path = require('path');

// This script updates the Lambda service URLs after deployment
// It reads the amplify_outputs.json and updates the lambdaService.ts file

async function updateLambdaUrls() {
  try {
    console.log('🔧 Updating Lambda service URLs...');
    
    // Read amplify_outputs.json
    const outputsPath = path.join(__dirname, '..', 'amplify_outputs.json');
    const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    
    // Read lambdaService.ts
    const lambdaServicePath = path.join(__dirname, '..', 'src', 'lib', 'lambdaService.ts');
    let lambdaServiceContent = fs.readFileSync(lambdaServicePath, 'utf8');
    
    // Extract API Gateway URLs from outputs
    const apiGatewayUrl = outputs.custom?.fileProcessor?.apiGatewayUrl || 
                         outputs.custom?.notificationService?.apiGatewayUrl ||
                         outputs.custom?.analyticsService?.apiGatewayUrl ||
                         outputs.custom?.backupService?.apiGatewayUrl;
    
    if (apiGatewayUrl) {
      // Update the baseUrl in lambdaService.ts
      lambdaServiceContent = lambdaServiceContent.replace(
        /this\.baseUrl = 'https:\/\/your-api-gateway-url\.amazonaws\.com\/prod';/,
        `this.baseUrl = '${apiGatewayUrl}';`
      );
      
      // Write the updated content back
      fs.writeFileSync(lambdaServicePath, lambdaServiceContent);
      console.log('✅ Lambda service URLs updated successfully');
    } else {
      console.log('⚠️ API Gateway URL not found in outputs. Please update manually.');
    }
    
  } catch (error) {
    console.error('❌ Error updating Lambda URLs:', error.message);
  }
}

updateLambdaUrls();
