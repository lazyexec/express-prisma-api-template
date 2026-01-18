import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import response from "../../utils/response";
import { settingsService } from "./settings.service";
import { Request, Response } from "express";

const modifyTermsAndCondition = catchAsync(
  async (req: Request, res: Response) => {
    const data = await settingsService.modifyTermsAndCondition(req.body);
    res.status(httpStatus.CREATED).json(
      response({
        message: "Terms and Conditions Updated",
        status: httpStatus.CREATED,
        data,
      })
    );
  }
);

const getTermsAndCondition = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getTermsAndCondition();
  res.status(httpStatus.OK).json(
    response({
      message: "Terms and Conditions Fetched",
      status: httpStatus.OK,
      data,
    })
  );
});

const modifyAboutUs = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.modifyAboutUs(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "About Us Updated",
      status: httpStatus.CREATED,
      data,
    })
  );
});

const getAboutUs = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getAboutUs();
  res.status(httpStatus.OK).json(
    response({
      message: "About Us Fetched",
      status: httpStatus.OK,
      data,
    })
  );
});

const modifyPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.modifyPrivacyPolicy(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Privacy Policy Updated",
      status: httpStatus.CREATED,
      data,
    })
  );
});

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getPrivacyPolicy();
  res.status(httpStatus.OK).json(
    response({
      message: "Privacy Policy Fetched",
      status: httpStatus.OK,
      data,
    })
  );
});

const modifyFAQ = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.modifyFAQ(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "FAQ Updated",
      status: httpStatus.CREATED,
      data,
    })
  );
});

const getFAQ = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getFAQ();
  res.status(httpStatus.OK).json(
    response({
      message: "FAQ Fetched",
      status: httpStatus.OK,
      data,
    })
  );
});

export const settingsController = {
  modifyTermsAndCondition,
  getTermsAndCondition,
  modifyAboutUs,
  getAboutUs,
  modifyPrivacyPolicy,
  getPrivacyPolicy,
  modifyFAQ,
  getFAQ,
};
