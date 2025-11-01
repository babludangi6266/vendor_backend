import Admin from '../models/Admin.js';

export const createInitialSuperAdmin = async () => {
  try {
    const superAdminExists = await Admin.findOne({ where: { role: 'super_admin' } });
    
    if (!superAdminExists) {
      await Admin.create({
        email: 'babludangi2000@gmail.com',
        password: 'bablu@9788',
        name: 'Super Administrator',
        role: 'super_admin',
        isActive: true
      });
      console.log('✅ Super Admin account created successfully');
    } else {
      console.log('✅ Super Admin account already exists');
    }
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  }
};