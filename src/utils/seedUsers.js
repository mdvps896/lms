// Seed default users in MongoDB
export const seedDefaultUsers = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const response = await fetch('/api/seed', {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.success) {
      }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};
