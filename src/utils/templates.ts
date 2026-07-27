/**
 * Built-in Preset Templates for SimpleSheet
 */

import { Template } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'monthly-budget',
    name: 'Monthly Budget Tracker',
    description: 'Track income, fixed expenses, and calculate net savings with auto-sum formulas.',
    icon: 'Wallet',
    category: 'Finance',
    sheets: [
      {
        id: 'sheet-budget',
        name: 'Monthly Budget',
        rowCount: 50,
        colCount: 26,
        data: {
          'A1': { value: 'MONTHLY BUDGET PLANNER', bold: true, fontSize: 16, color: '#1e3a8a', bg: '#dbeafe' },
          'A3': { value: 'INCOME SOURCES', bold: true, fontSize: 13, color: '#065f46', bg: '#d1fae5' },
          'B3': { value: 'AMOUNT ($)', bold: true, align: 'right', bg: '#d1fae5' },
          'A4': { value: 'Primary Salary' },
          'B4': { value: '4500', format: 'currency', align: 'right' },
          'A5': { value: 'Freelance / Consulting' },
          'B5': { value: '1200', format: 'currency', align: 'right' },
          'A6': { value: 'Investment Dividends' },
          'B6': { value: '350', format: 'currency', align: 'right' },
          'A7': { value: 'Total Income', bold: true, bg: '#ecfdf5' },
          'B7': { value: '=SUM(B4:B6)', bold: true, format: 'currency', align: 'right', bg: '#ecfdf5' },

          'A9': { value: 'EXPENSES', bold: true, fontSize: 13, color: '#991b1b', bg: '#fee2e2' },
          'B9': { value: 'BUDGETED ($)', bold: true, align: 'right', bg: '#fee2e2' },
          'A10': { value: 'Rent / Mortgage' },
          'B10': { value: '1800', format: 'currency', align: 'right' },
          'A11': { value: 'Groceries & Food' },
          'B11': { value: '650', format: 'currency', align: 'right' },
          'A12': { value: 'Utilities & Internet' },
          'B12': { value: '280', format: 'currency', align: 'right' },
          'A13': { value: 'Transportation & Gas' },
          'B13': { value: '200', format: 'currency', align: 'right' },
          'A14': { value: 'Entertainment & Dining' },
          'B14': { value: '300', format: 'currency', align: 'right' },
          'A15': { value: 'Total Expenses', bold: true, bg: '#fef2f2' },
          'B15': { value: '=SUM(B10:B14)', bold: true, format: 'currency', align: 'right', bg: '#fef2f2' },

          'A17': { value: 'NET SAVINGS / SURPLUS', bold: true, fontSize: 14, color: '#1e40af', bg: '#e0e7ff' },
          'B17': { value: '=B7-B15', bold: true, fontSize: 14, format: 'currency', align: 'right', bg: '#e0e7ff' }
        }
      }
    ]
  },
  {
    id: 'student-gradebook',
    name: 'Classroom Gradebook',
    description: 'Calculate average test scores, highest, and lowest student performance.',
    icon: 'GraduationCap',
    category: 'Education',
    sheets: [
      {
        id: 'sheet-gradebook',
        name: 'Gradebook',
        rowCount: 50,
        colCount: 26,
        data: {
          'A1': { value: 'STUDENT GRADEBOOK (SPRING 2026)', bold: true, fontSize: 16, color: '#3730a3', bg: '#e0e7ff' },
          'A3': { value: 'Student Name', bold: true, bg: '#f3f4f6' },
          'B3': { value: 'Exam 1', bold: true, align: 'right', bg: '#f3f4f6' },
          'C3': { value: 'Exam 2', bold: true, align: 'right', bg: '#f3f4f6' },
          'D3': { value: 'Project 1', bold: true, align: 'right', bg: '#f3f4f6' },
          'E3': { value: 'Final Average', bold: true, align: 'right', bg: '#e0e7ff' },

          'A4': { value: 'Alice Smith' },
          'B4': { value: '92', align: 'right' },
          'C4': { value: '88', align: 'right' },
          'D4': { value: '95', align: 'right' },
          'E4': { value: '=AVERAGE(B4:D4)', bold: true, align: 'right', format: 'number' },

          'A5': { value: 'Bob Johnson' },
          'B5': { value: '78', align: 'right' },
          'C5': { value: '82', align: 'right' },
          'D5': { value: '85', align: 'right' },
          'E5': { value: '=AVERAGE(B5:D5)', bold: true, align: 'right', format: 'number' },

          'A6': { value: 'Charlie Brown' },
          'B6': { value: '85', align: 'right' },
          'C6': { value: '90', align: 'right' },
          'D6': { value: '92', align: 'right' },
          'E6': { value: '=AVERAGE(B6:D6)', bold: true, align: 'right', format: 'number' },

          'A7': { value: 'Diana Prince' },
          'B7': { value: '96', align: 'right' },
          'C7': { value: '94', align: 'right' },
          'D7': { value: '98', align: 'right' },
          'E7': { value: '=AVERAGE(B7:D7)', bold: true, align: 'right', format: 'number' },

          'A9': { value: 'Class Average', bold: true, bg: '#fef3c7' },
          'B9': { value: '=AVERAGE(B4:B7)', bold: true, align: 'right', format: 'number', bg: '#fef3c7' },
          'C9': { value: '=AVERAGE(C4:C7)', bold: true, align: 'right', format: 'number', bg: '#fef3c7' },
          'D9': { value: '=AVERAGE(D4:D7)', bold: true, align: 'right', format: 'number', bg: '#fef3c7' },
          'E9': { value: '=AVERAGE(E4:E7)', bold: true, align: 'right', format: 'number', bg: '#fef3c7' },

          'A10': { value: 'Highest Score', bold: true },
          'E10': { value: '=MAX(E4:E7)', bold: true, align: 'right', format: 'number' },

          'A11': { value: 'Lowest Score', bold: true },
          'E11': { value: '=MIN(E4:E7)', bold: true, align: 'right', format: 'number' }
        }
      }
    ]
  },
  {
    id: 'inventory-manager',
    name: 'Inventory Stock Tracker',
    description: 'Manage products, quantities, unit prices, total value, and reorder status.',
    icon: 'Package',
    category: 'Business',
    sheets: [
      {
        id: 'sheet-inventory',
        name: 'Inventory',
        rowCount: 50,
        colCount: 26,
        data: {
          'A1': { value: 'PRODUCT INVENTORY TRACKER', bold: true, fontSize: 16, color: '#854d0e', bg: '#fef9c3' },
          'A3': { value: 'SKU / Item', bold: true, bg: '#f3f4f6' },
          'B3': { value: 'Product Description', bold: true, bg: '#f3f4f6' },
          'C3': { value: 'Qty in Stock', bold: true, align: 'right', bg: '#f3f4f6' },
          'D3': { value: 'Unit Price ($)', bold: true, align: 'right', bg: '#f3f4f6' },
          'E3': { value: 'Total Value ($)', bold: true, align: 'right', bg: '#fef08a' },

          'A4': { value: 'SKU-101' },
          'B4': { value: 'Wireless Ergonomic Mouse' },
          'C4': { value: '45', align: 'right' },
          'D4': { value: '29.99', format: 'currency', align: 'right' },
          'E4': { value: '=C4*D4', bold: true, format: 'currency', align: 'right' },

          'A5': { value: 'SKU-102' },
          'B5': { value: 'Mechanical RGB Keyboard' },
          'C5': { value: '18', align: 'right' },
          'D5': { value: '89.50', format: 'currency', align: 'right' },
          'E5': { value: '=C5*D5', bold: true, format: 'currency', align: 'right' },

          'A6': { value: 'SKU-103' },
          'B6': { value: 'UltraWide 27" Monitor' },
          'C6': { value: '8', align: 'right' },
          'D6': { value: '349.00', format: 'currency', align: 'right' },
          'E6': { value: '=C6*D6', bold: true, format: 'currency', align: 'right' },

          'A7': { value: 'SKU-104' },
          'B7': { value: 'USB-C Docking Station' },
          'C7': { value: '32', align: 'right' },
          'D7': { value: '119.99', format: 'currency', align: 'right' },
          'E7': { value: '=C7*D7', bold: true, format: 'currency', align: 'right' },

          'A9': { value: 'TOTAL INVENTORY VALUE', bold: true, bg: '#fef08a' },
          'C9': { value: '=SUM(C4:C7)', bold: true, align: 'right' },
          'E9': { value: '=SUM(E4:E7)', bold: true, format: 'currency', align: 'right', bg: '#fef08a' },

          'A10': { value: 'Total Unique Items', bold: true },
          'C10': { value: '=COUNT(C4:C7)', bold: true, align: 'right' }
        }
      }
    ]
  }
];
