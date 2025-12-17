interface ResDataOptions {
  message?: string | undefined | null;
  error?: string | undefined | null;
  data?: any[] | null | undefined | object | string | number | boolean;
  success?: boolean | undefined | null;
  [key: string]: any;
}

export const cResponseData = ({
  message = null,
  error = null,
  data = null,
  success = null,
  ...optional
}: ResDataOptions) => {
  if (
    (Array.isArray(data) && data.length < 1) ||
    (data && typeof data === 'object' && Object.keys(data).length < 1) ||
    !data
  ) {
    message = message ?? 'No data found';
    success = false;
    error = error ?? 'No data found';
  } else {
    message = message ?? 'Data retrieved successfully';
    success = success ?? true;
    error = error ?? null;
  }

  return {
    message,
    error,
    data,
    success,
    ...optional,
  };
};
