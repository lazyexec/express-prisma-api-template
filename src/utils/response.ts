interface responseInterface {
  status: number;
  message: string;
  type?: string;
  data?: any;
  token?: any;
  pagination?: any;
}

export default (response: responseInterface) => {
  const { status, message, data = {}, type, token, pagination } = response;

  return {
    status,
    message,
    response: {
      ...(type && { type }),
      data,
      ...(token && { tokens: token }),
      ...(pagination && { pagination }),
    },
  };
};
