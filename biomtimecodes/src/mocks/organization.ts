export interface Department {
  id: string;
  code: string;
  name: string;
  superior: string;
  employeeQty: number;
  resignedQty: number;
  manager: string;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  employeeQty: number;
}

export interface Area {
  id: string;
  code: string;
  name: string;
  timezone: string;
  devices: number;
  employees: number;
}

export const mockDepartments: Department[] = [
  { id: 'd1', code: '1', name: 'HEAD-OFFICE', superior: '-', employeeQty: 126, resignedQty: 0, manager: '-' },
  { id: 'd2', code: 'MAGBORO COMMISSARY', name: 'MAGBORO COMMISSARY', superior: 'HEAD-OFFICE', employeeQty: 84, resignedQty: 0, manager: '-' },
  { id: 'd3', code: 'CSC General', name: 'CSC General', superior: '-', employeeQty: 22, resignedQty: 0, manager: '-' },
  { id: 'd4', code: 'Development', name: 'Development', superior: '-', employeeQty: 0, resignedQty: 0, manager: '-' },
  { id: 'd5', code: 'DP-Commissary', name: 'DP-Commissary', superior: '-', employeeQty: 0, resignedQty: 0, manager: '-' },
  { id: 'd6', code: 'DP General', name: 'DP General', superior: '-', employeeQty: 19, resignedQty: 0, manager: '-' },
  { id: 'd7', code: 'Field Governance', name: 'Field Governance', superior: '-', employeeQty: 0, resignedQty: 0, manager: '-' },
  { id: 'd8', code: 'Finance', name: 'Finance', superior: '-', employeeQty: 1, resignedQty: 0, manager: '-' },
  { id: 'd9', code: 'HR and Admin', name: 'HR and Admin', superior: 'HEAD-OFFICE', employeeQty: 1, resignedQty: 0, manager: '-' },
  { id: 'd10', code: 'IT', name: 'IT Department', superior: 'HEAD-OFFICE', employeeQty: 5, resignedQty: 0, manager: '-' },
  { id: 'd11', code: 'Logistics', name: 'Logistics', superior: '-', employeeQty: 12, resignedQty: 0, manager: '-' },
  { id: 'd12', code: 'Operations', name: 'Operations', superior: 'HEAD-OFFICE', employeeQty: 45, resignedQty: 2, manager: '-' },
  { id: 'd13', code: 'Procurement', name: 'Procurement', superior: '-', employeeQty: 8, resignedQty: 0, manager: '-' },
  { id: 'd14', code: 'Quality Control', name: 'Quality Control', superior: '-', employeeQty: 6, resignedQty: 0, manager: '-' },
  { id: 'd15', code: 'Sales', name: 'Sales', superior: 'HEAD-OFFICE', employeeQty: 23, resignedQty: 1, manager: '-' },
  { id: 'd16', code: 'Security', name: 'Security', superior: '-', employeeQty: 10, resignedQty: 0, manager: '-' },
  { id: 'd17', code: 'Kitchen', name: 'Kitchen', superior: 'HEAD-OFFICE', employeeQty: 18, resignedQty: 0, manager: '-' },
  { id: 'd18', code: 'Accounts', name: 'Accounts', superior: 'Finance', employeeQty: 7, resignedQty: 0, manager: '-' },
  { id: 'd19', code: 'Maintenance', name: 'Maintenance', superior: '-', employeeQty: 4, resignedQty: 0, manager: '-' },
];

export const mockPositions: Position[] = [
  { id: 'p1', code: 'HEAD OFFICE', name: 'HEAD OFFICE', employeeQty: 232 },
  { id: 'p2', code: 'STORE MANAGER', name: 'Store Manager', employeeQty: 15 },
  { id: 'p3', code: 'CASHIER', name: 'Cashier', employeeQty: 45 },
  { id: 'p4', code: 'SUPERVISOR', name: 'Supervisor', employeeQty: 12 },
  { id: 'p5', code: 'DRIVER', name: 'Driver', employeeQty: 8 },
  { id: 'p6', code: 'CLEANER', name: 'Cleaner', employeeQty: 6 },
  { id: 'p7', code: 'SECURITY', name: 'Security', employeeQty: 10 },
  { id: 'p8', code: 'BAKER', name: 'Baker', employeeQty: 20 },
  { id: 'p9', code: 'CHEF', name: 'Chef', employeeQty: 14 },
  { id: 'p10', code: 'ACCOUNTANT', name: 'Accountant', employeeQty: 7 },
  { id: 'p11', code: 'HR OFFICER', name: 'HR Officer', employeeQty: 3 },
  { id: 'p12', code: 'IT OFFICER', name: 'IT Officer', employeeQty: 5 },
];

export const mockAreas: Area[] = [
  { id: 'a1', code: 'HEAD OFFICE', name: 'HEAD OFFICE', timezone: 'Africa/Lagos', devices: 1, employees: 126 },
  { id: 'a2', code: 'AROMIRE STORE', name: 'AROMIRE STORE', timezone: 'Africa/Lagos', devices: 1, employees: 16 },
  { id: 'a3', code: 'IKOTUN', name: 'IKOTUN', timezone: 'Africa/Lagos', devices: 1, employees: 1 },
  { id: 'a4', code: 'OGUDU', name: 'OGUDU', timezone: 'Africa/Lagos', devices: 1, employees: 2 },
  { id: 'a5', code: 'AGIDINGBI', name: 'AGIDINGBI', timezone: 'Africa/Lagos', devices: 1, employees: 0 },
  { id: 'a6', code: 'EGBEDA STORE', name: 'EGBEDA STORE', timezone: 'Africa/Lagos', devices: 1, employees: 2 },
  { id: 'a7', code: 'ILUPEJU', name: 'ILUPEJU', timezone: 'Africa/Lagos', devices: 1, employees: 1 },
  { id: 'a8', code: 'TOYIN STORE', name: 'TOYIN STORE', timezone: 'Africa/Lagos', devices: 1, employees: 2 },
  { id: 'a9', code: 'MARYLAND', name: 'MARYLAND', timezone: 'Africa/Lagos', devices: 1, employees: 1 },
  { id: 'a10', code: 'Magboro-Commissary', name: 'Magboro-Commissary', timezone: 'Africa/Lagos', devices: 1, employees: 108 },
  { id: 'a11', code: 'LEKKI', name: 'LEKKI', timezone: 'Africa/Lagos', devices: 0, employees: 0 },
  { id: 'a12', code: 'VICTORIA ISLAND', name: 'VICTORIA ISLAND', timezone: 'Africa/Lagos', devices: 0, employees: 5 },
];
