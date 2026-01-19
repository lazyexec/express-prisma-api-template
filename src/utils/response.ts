interface responseInterface {
  success?: boolean;
  status: number;
  message: string;
  type?: string;
  data?: any;
  token?: any;
}

export default (response: responseInterface) => {
  const {
    success,
    status,
    message,
    data = {},
    type,
    token,
  } = response;

  return {
    success: success || (status >= 200 && status < 300),
    status,
    message,
    response: {
      ...(type && { type }),
      data,
      ...(token && { tokens: token })
    },
  };
};
