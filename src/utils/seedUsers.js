// Seed default users in MongoDB
export const seedDefaultUsers = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const response = await fetch('/api/seed', {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('Default users seeded in MongoDB:', data.count);
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};
