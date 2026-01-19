interface responseInterface {
  success?: boolean;
  status: number;
  message: string;
  type?: string;
  data?: any;
  token?: any;
}

export default (response: responseInterface) => {
  const { success, status, message, data = {}, type, token } = response;

  const isSuccess =
    typeof success === "boolean" ? success : status >= 200 && status < 300;

  return {
    success: isSuccess,
    status: status,
    message,
    response: {
      ...(type && { type }),
      data,
      ...(token && { tokens: token }),
    },
  };
};
