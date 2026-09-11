export {};

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => string;

      customers: {
        getAll: () => Promise<
          Array<{
            id: number;
            customerCode: string;
            name: string;
            contactNumber: string;
            address: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
          }>
        >;

        create: (data: {
          customerCode: string;
          name: string;
          contactNumber: string;
          address: string;
        }) => Promise<unknown>;

        update: (
          id: number,
          data: {
            name: string;
            contactNumber: string;
            address: string;
          },
        ) => Promise<unknown>;

        delete: (id: number) => Promise<unknown>;
      };
    };
  }
}