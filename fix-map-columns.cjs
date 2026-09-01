const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

const target = `  if (tableName === 'establishments') {
    Object.keys(clean).forEach(k => {
      if (clean[k] === undefined) {
        delete clean[k];
      }
    });
    // Ensure all quoted columns map correctly if needed, though Supabase client usually handles camelCase if the DB column is strictly camelCase with quotes.
    // The columns in DB are: "ownerId", "openingHours", "menuPdfUrl", "menuImages", "averageRating", "hairSalonData", "createdAt", "updatedAt"
  }`;

const replacement = `  if (tableName === 'establishments') {
    Object.keys(clean).forEach(k => {
      if (clean[k] === undefined) {
        delete clean[k];
      }
    });
    
    // In postgres, case-sensitive columns are explicitly quoted.
    // PostgREST/Supabase client preserves case if we pass it, 
    // but occasionally properties need mapping if they differ from JS.
    // The columns in DB are: "ownerId", "openingHours", "menuPdfUrl", "menuImages", "averageRating", "hairSalonData", "createdAt", "updatedAt"
    // So JS ownerId -> DB ownerId is a direct match, but if we have any camelCase issue we would map them here.
  }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/store.tsx', code);
console.log('Done!');
