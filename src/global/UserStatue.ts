export const setUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).data : null;
};

export const removeUser = () => {
  sessionStorage.removeItem('user');
};
