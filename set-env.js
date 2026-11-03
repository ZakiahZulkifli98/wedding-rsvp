const fs = require('fs');

const targetPath = './src/environments/environment.ts';

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseKey: '${process.env.SUPABASE_KEY || ''}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated successfully at ${targetPath}`);
