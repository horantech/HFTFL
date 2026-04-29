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
    accountNumber: "1000321129254",
  },
  {
    bank: "Bank of Abyssinia",
    accountName: "Hope for the Fatherless",
    accountNumber: "38812947",
  },
  {
    bank: "Birhan Bank",
    accountName: "Hope for the Fatherless",
    accountNumber: "2601680015655",
  },
  {
    bank: "Hibret Bank",
    accountName: "Hope for the Fatherless",
    accountNumber: "4731111625714014",
  },
  {
    bank: "Zemen Bank",
    accountName: "Hope for the Fatherless",
    accountNumber: "1292411208852012",
  },
];
