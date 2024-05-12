// // import { SEEDER_EMAIL, SEEDER_PASSWORD } from '@config';
// import { UserInterface } from '@interfaces/User.Interface';
// import UserRepository from '@repositories/User.repository';
// import { logger } from '@utils/logger';

// export default async () => {
//   const defaultEmail = global.ENV.SEEDER_EMAIL;
//   const defaultPassword = global.ENV.SEEDER_PASSWORD;
//   const authService = new UserRepository();

//   try {
//     const admin = await authService.findOne({
//       email: defaultEmail,
//     });

//     if (!admin) {
//       await authService.create(<UserInterface>{
//         email: defaultEmail,
//         password: defaultPassword,
//         role: 'admin',
//       });
//     } else {
//       authService.update(admin._id, { password: defaultPassword });
//     }
//   } catch (error: any) {
//     logger.error([error]);
//   }
// };
