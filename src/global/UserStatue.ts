export const setUser = (user: any) => {
  sessionStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user).data : null;
};
