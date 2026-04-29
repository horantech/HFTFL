// Bank accounts shown on the public pledge form page.
// Update with the real account numbers before going live.
export type BankAccount = {
  bank: string;
  accountName: string;
  accountNumber: string;
};

export const ACCOUNTS: BankAccount[] = [
  {
    bank: "Commercial Bank of Ethiopia (CBE)",
    accountName: "Hope for the Fatherless",
    accountNumber: "1000-XXXXXXXX",
  },
  {
    bank: "Awash Bank",
    accountName: "Hope for the Fatherless",
    accountNumber: "0130-XXXXXXXX",
  },
  {
    bank: "Wegagen Bank",
    accountName: "Hope for the Fatherless",
    accountNumber: "1234-XXXXXXXX",
  },
];
