const bcrypt = require("bcrypt");

const { db } = require("../utils/admin");

const usersDB = db.collection("Users");

const checkUserExists = async (user) => {
  return await usersDB
    .doc(user.email)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return true;
      } else {
        // doc.data() will be undefined in this case
        return false;
      }
    });
};

const verifyUser = async (user) => {
  return await usersDB
    .doc(user.email)
    .get()
    .then(async (doc) => {
      if (doc.exists) {
        const isPasswordValid = await bcrypt.compare(
          user.password,
          doc.data().password
        );

        return isPasswordValid && true;
      } else {
        return false;
      }
    });
};

const storeUser = async (user) => {
  let { firstName, lastName, email, phoneNumber, password } = user;

  let saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await usersDB.doc(email).set({
    firstName,
    lastName,
    email,
    phoneNumber,
    password: hashedPassword,
  });
};

const addUserPasswordResetToken = async (user, token) => {
  await usersDB.doc(user.email).update({
    resetPasswordToken: token,
    resetPasswordExpires: Date.now() + 3600000,
  });
};

const resetUserPassword = async (token, newPassword) => {
  return await usersDB
    .where("resetPasswordToken", "==", token)
    .get()
    .then(async (docs) => {
      if (!docs.empty) {
        let id;
        docs.forEach((doc) => {
          id = doc.id;
        });

        if (
          (await usersDB.doc(id).get()).data().resetPasswordExpires < Date.now()
        ) {
          return false;
        }

        let saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await usersDB.doc(id).update({
          password: hashedPassword,
        });

        return true;
      } else return false;
    });
};

module.exports = {
  checkUserExists,
  storeUser,
  verifyUser,
  addUserPasswordResetToken,
  resetUserPassword,
};
