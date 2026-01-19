const objectId = (value: string) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return false;
  }
  return true;
};

const password = (value: string) => {
  if (value.length < 8) {
    return false;
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return false;
  }
  return true;
};

export default {
  objectId,
  password,
};
