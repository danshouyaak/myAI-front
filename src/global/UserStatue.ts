export const setUser = (user) => {
  sessionStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user).data : null;
};
