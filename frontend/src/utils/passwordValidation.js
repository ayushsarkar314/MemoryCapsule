export const checkPasswordStrength = (password = '') => {
  const minLength  = password.length >= 6;
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const isStrong = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isStrong,
  };
};

export const validateEmail = (email = '') => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email.trim());
};
