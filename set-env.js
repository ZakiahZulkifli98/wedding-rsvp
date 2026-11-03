const fs = require('fs');
const path = require('path');

const dirPath = './src/environments';
const targetPath = path.join(dirPath, 'environment.ts');

// Cipta folder src/environments secara automatik jika tiada
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseKey: '${process.env.SUPABASE_KEY || ''}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated successfully at ${targetPath}`);
