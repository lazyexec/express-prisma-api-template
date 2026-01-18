import type { IUser } from "../modules/user/user.interface";

declare module "socket.io" {
  interface Socket {
    user?: IUser;
  }
}
