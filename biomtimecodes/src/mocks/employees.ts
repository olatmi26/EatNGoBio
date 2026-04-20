export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  area: string;
  employmentType: string;
  hiredDate: string;
  gender: string;
  email: string;
  mobile: string;
  status: 'active' | 'resigned' | 'probation';
  avatar?: string;
}

export const mockEmployees: Employee[] = [
  { id: 'e1', employeeId: '00237', firstName: 'Kuzunwhe', lastName: 'Adeyemi', department: 'HEAD-OFFICE', position: 'HEAD OFFICE', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2022-01-15', gender: 'Male', email: 'kuzunwhe@eatngo.com', mobile: '08012345678', status: 'active' },
  { id: 'e2', employeeId: '1', firstName: 'Taiwo', lastName: 'Hassan', department: 'HEAD-OFFICE', position: 'SUPERVISOR', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2020-03-01', gender: 'Male', email: 'taiwo@eatngo.com', mobile: '08023456789', status: 'active' },
  { id: 'e3', employeeId: '10082', firstName: 'Odunayo', lastName: 'Okafor', department: 'HEAD-OFFICE', position: 'CASHIER', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2023-06-10', gender: 'Female', email: 'odunayo@eatngo.com', mobile: '08034567890', status: 'active' },
  { id: 'e4', employeeId: '10199', firstName: 'Godwin', lastName: 'Eze', department: 'MAGBORO COMMISSARY', position: 'STORE MANAGER', area: 'Magboro-Commissary', employmentType: 'Full-Time', hiredDate: '2021-09-20', gender: 'Male', email: 'godwin@eatngo.com', mobile: '08045678901', status: 'active' },
  { id: 'e5', employeeId: '10245', firstName: 'Adaeze', lastName: 'Nwosu', department: 'Operations', position: 'SUPERVISOR', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2022-11-05', gender: 'Female', email: 'adaeze@eatngo.com', mobile: '08056789012', status: 'active' },
  { id: 'e6', employeeId: '10301', firstName: 'Emeka', lastName: 'Obi', department: 'IT', position: 'IT OFFICER', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2023-01-15', gender: 'Male', email: 'emeka@eatngo.com', mobile: '08067890123', status: 'active' },
  { id: 'e7', employeeId: '10388', firstName: 'Fatima', lastName: 'Bello', department: 'HR and Admin', position: 'HR OFFICER', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2021-07-22', gender: 'Female', email: 'fatima@eatngo.com', mobile: '08078901234', status: 'active' },
  { id: 'e8', employeeId: '10412', firstName: 'Babatunde', lastName: 'Lawal', department: 'Security', position: 'SECURITY', area: 'HEAD OFFICE', employmentType: 'Contract', hiredDate: '2024-02-01', gender: 'Male', email: 'babatunde@eatngo.com', mobile: '08089012345', status: 'active' },
  { id: 'e9', employeeId: '10455', firstName: 'Ngozi', lastName: 'Amadi', department: 'Kitchen', position: 'CHEF', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2022-05-18', gender: 'Female', email: 'ngozi@eatngo.com', mobile: '08090123456', status: 'active' },
  { id: 'e10', employeeId: '10502', firstName: 'Chukwuemeka', lastName: 'Eze', department: 'Finance', position: 'ACCOUNTANT', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2020-08-30', gender: 'Male', email: 'chukwuemeka@eatngo.com', mobile: '08001234567', status: 'active' },
  { id: 'e11', employeeId: '10567', firstName: 'Amina', lastName: 'Yusuf', department: 'Accounts', position: 'ACCOUNTANT', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2023-03-12', gender: 'Female', email: 'amina@eatngo.com', mobile: '08012340987', status: 'active' },
  { id: 'e12', employeeId: '10601', firstName: 'Halima', lastName: 'Musa', department: 'Procurement', position: 'SUPERVISOR', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2021-12-01', gender: 'Female', email: 'halima@eatngo.com', mobile: '08023451098', status: 'active' },
  { id: 'e13', employeeId: '10644', firstName: 'Tunde', lastName: 'Fashola', department: 'Operations', position: 'CASHIER', area: 'AROMIRE STORE', employmentType: 'Full-Time', hiredDate: '2022-09-14', gender: 'Male', email: 'tunde@eatngo.com', mobile: '08034562109', status: 'active' },
  { id: 'e14', employeeId: '10700', firstName: 'Oluwaseun', lastName: 'Adeyemi', department: 'Logistics', position: 'DRIVER', area: 'HEAD OFFICE', employmentType: 'Contract', hiredDate: '2023-07-20', gender: 'Male', email: 'oluwaseun@eatngo.com', mobile: '08045673210', status: 'active' },
  { id: 'e15', employeeId: '10755', firstName: 'Chioma', lastName: 'Okafor', department: 'Sales', position: 'CASHIER', area: 'IKOTUN', employmentType: 'Full-Time', hiredDate: '2024-01-08', gender: 'Female', email: 'chioma@eatngo.com', mobile: '08056784321', status: 'probation' },
  { id: 'e16', employeeId: '10800', firstName: 'Ibrahim', lastName: 'Suleiman', department: 'Security', position: 'SECURITY', area: 'OGUDU', employmentType: 'Contract', hiredDate: '2023-11-15', gender: 'Male', email: 'ibrahim@eatngo.com', mobile: '08067895432', status: 'active' },
  { id: 'e17', employeeId: '10845', firstName: 'Blessing', lastName: 'Nwachukwu', department: 'Kitchen', position: 'BAKER', area: 'Magboro-Commissary', employmentType: 'Full-Time', hiredDate: '2022-04-25', gender: 'Female', email: 'blessing@eatngo.com', mobile: '08078906543', status: 'active' },
  { id: 'e18', employeeId: '10901', firstName: 'Segun', lastName: 'Ogundimu', department: 'Maintenance', position: 'SUPERVISOR', area: 'HEAD OFFICE', employmentType: 'Full-Time', hiredDate: '2021-06-10', gender: 'Male', email: 'segun@eatngo.com', mobile: '08089017654', status: 'active' },
  { id: 'e19', employeeId: '10950', firstName: 'Yetunde', lastName: 'Afolabi', department: 'Sales', position: 'CASHIER', area: 'EGBEDA STORE', employmentType: 'Full-Time', hiredDate: '2023-08-22', gender: 'Female', email: 'yetunde@eatngo.com', mobile: '08090128765', status: 'active' },
  { id: 'e20', employeeId: '11001', firstName: 'Musa', lastName: 'Abdullahi', department: 'Logistics', position: 'DRIVER', area: 'HEAD OFFICE', employmentType: 'Contract', hiredDate: '2024-03-05', gender: 'Male', email: 'musa@eatngo.com', mobile: '08001239876', status: 'probation' },
];
