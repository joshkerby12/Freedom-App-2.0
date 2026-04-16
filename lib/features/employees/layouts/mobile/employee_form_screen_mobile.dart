import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ground_control_pro/core/extensions/async_value_extensions.dart';
import 'package:ground_control_pro/features/employees/helpers/employee_calculations.dart';
import 'package:ground_control_pro/features/employees/helpers/employee_validators.dart';
import 'package:ground_control_pro/features/employees/providers/current_employee_provider.dart';
import 'package:ground_control_pro/features/employees/providers/employee_detail_provider.dart';
import 'package:ground_control_pro/features/employees/providers/employee_list_provider.dart';
import 'package:ground_control_pro/features/employees/providers/permission_provider.dart';
import 'package:ground_control_pro/features/employees/providers/role_list_provider.dart';
import 'package:ground_control_pro/features/employees/services/employee_service.dart';
import 'package:ground_control_pro/features/orgs/org_notifier.dart';

class EmployeeFormScreenMobile extends ConsumerStatefulWidget {
  const EmployeeFormScreenMobile({super.key, this.employeeId});

  final String? employeeId;

  bool get isEdit => employeeId != null;

  @override
  ConsumerState<EmployeeFormScreenMobile> createState() =>
      _EmployeeFormScreenMobileState();
}

class _EmployeeFormScreenMobileState
    extends ConsumerState<EmployeeFormScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _displayNameController = TextEditingController();
  final _personalEmailController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _titleController = TextEditingController();
  final _positionController = TextEditingController();
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();
  final _payRateController = TextEditingController();

  String? _selectedRoleId;
  String _employmentType = 'full_time';
  String _status = 'active';
  String _payType = 'hourly';
  bool _isSales = false;
  bool _tracksHours = true;
  bool _onVehicleInsurance = false;
  bool _hasCompanyCard = false;
  bool _initialized = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _displayNameController.dispose();
    _personalEmailController.dispose();
    _companyEmailController.dispose();
    _phoneController.dispose();
    _titleController.dispose();
    _positionController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    _payRateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canManage = ref.watch(hasPermissionProvider('employees.manage'));
    final canViewComp = ref.watch(hasPermissionProvider('compensation.view'));

    if (canManage.valueOrNull == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to manage employees.'),
        ),
      );
    }

    final rolesAsync = ref.watch(roleListProvider);
    final employeeAsync = widget.isEdit
        ? ref.watch(employeeDetailProvider(widget.employeeId!))
        : const AsyncData(null);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit Employee' : 'Add Employee'),
      ),
      body: SafeArea(
        child: employeeAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Failed to load: $error')),
          data: (employee) {
            if (!_initialized) {
              _initializeForm(employee);
            }

            return Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: ListView(
                  children: [
                    TextFormField(
                      controller: _firstNameController,
                      decoration: const InputDecoration(
                        labelText: 'First Name',
                      ),
                      validator: (value) =>
                          requiredText(value, fieldLabel: 'First Name'),
                      onChanged: (_) => _maybeSuggestDisplayName(),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _lastNameController,
                      decoration: const InputDecoration(labelText: 'Last Name'),
                      validator: (value) =>
                          requiredText(value, fieldLabel: 'Last Name'),
                      onChanged: (_) => _maybeSuggestDisplayName(),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _displayNameController,
                      decoration: InputDecoration(
                        labelText: 'Display Name (optional)',
                        hintText: suggestedDisplayName(
                          firstName: _firstNameController.text,
                          lastName: _lastNameController.text,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _personalEmailController,
                      decoration: const InputDecoration(
                        labelText: 'Personal Email',
                      ),
                      validator: (value) =>
                          optionalEmail(value, fieldLabel: 'personal email'),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _companyEmailController,
                      decoration: const InputDecoration(
                        labelText: 'Company Email',
                      ),
                      validator: (value) =>
                          optionalEmail(value, fieldLabel: 'company email'),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(labelText: 'Phone'),
                    ),
                    const SizedBox(height: 10),
                    rolesAsync.when(
                      data: (roles) {
                        _selectedRoleId ??= roles.isNotEmpty
                            ? roles.first.id
                            : null;

                        return DropdownButtonFormField<String>(
                          value: _selectedRoleId,
                          decoration: const InputDecoration(labelText: 'Role'),
                          items: roles
                              .map(
                                (role) => DropdownMenuItem<String>(
                                  value: role.id,
                                  child: Text(role.name),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedRoleId = value;
                            });
                          },
                          validator: (value) {
                            if ((value ?? '').isEmpty) {
                              return 'Role is required';
                            }
                            return null;
                          },
                        );
                      },
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (error, _) => Text('Failed to load roles: $error'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _employmentType,
                      decoration: const InputDecoration(
                        labelText: 'Employment Type',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'full_time',
                          child: Text('Full Time'),
                        ),
                        DropdownMenuItem(
                          value: 'part_time',
                          child: Text('Part Time'),
                        ),
                        DropdownMenuItem(
                          value: 'temporary',
                          child: Text('Temporary'),
                        ),
                        DropdownMenuItem(
                          value: 'temp_agency',
                          child: Text('Temp Agency'),
                        ),
                        DropdownMenuItem(
                          value: 'contractor',
                          child: Text('Contractor'),
                        ),
                        DropdownMenuItem(
                          value: 'seasonal',
                          child: Text('Seasonal'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _employmentType = value;
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(
                          value: 'active',
                          child: Text('Active'),
                        ),
                        DropdownMenuItem(
                          value: 'on_leave',
                          child: Text('On Leave'),
                        ),
                        DropdownMenuItem(
                          value: 'terminated',
                          child: Text('Terminated'),
                        ),
                        DropdownMenuItem(
                          value: 'resigned',
                          child: Text('Resigned'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _status = value;
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Employee Title',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _positionController,
                      decoration: const InputDecoration(
                        labelText: 'Employee Position',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _startDateController,
                      decoration: const InputDecoration(
                        labelText: 'Start Date (YYYY-MM-DD)',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _endDateController,
                      decoration: const InputDecoration(
                        labelText: 'End Date (YYYY-MM-DD)',
                      ),
                    ),
                    const SizedBox(height: 10),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Sales Employee'),
                      value: _isSales,
                      onChanged: (value) => setState(() => _isSales = value),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Tracks Hours'),
                      value: _tracksHours,
                      onChanged: (value) =>
                          setState(() => _tracksHours = value),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('On Vehicle Insurance'),
                      value: _onVehicleInsurance,
                      onChanged: (value) =>
                          setState(() => _onVehicleInsurance = value),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Has Company Card'),
                      value: _hasCompanyCard,
                      onChanged: (value) =>
                          setState(() => _hasCompanyCard = value),
                    ),
                    if (canViewComp.valueOrNull == true) ...[
                      const Divider(height: 24),
                      Text(
                        'Compensation',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        value: _payType,
                        decoration: const InputDecoration(
                          labelText: 'Pay Type',
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'hourly',
                            child: Text('Hourly'),
                          ),
                          DropdownMenuItem(
                            value: 'salary',
                            child: Text('Salary'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() {
                            _payType = value;
                          });
                        },
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: _payRateController,
                        decoration: const InputDecoration(
                          labelText: 'Pay Rate',
                        ),
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        validator: (value) =>
                            optionalCurrency(value, fieldLabel: 'pay rate'),
                      ),
                    ],
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isSubmitting
                                ? null
                                : () => Navigator.of(context).pop(),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: _isSubmitting ? null : _save,
                            child: Text(
                              widget.isEdit ? 'Save Changes' : 'Save',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _initializeForm(dynamic employee) {
    _initialized = true;
    if (employee == null) {
      return;
    }

    _firstNameController.text = employee.firstName ?? '';
    _lastNameController.text = employee.lastName ?? '';
    _displayNameController.text = employee.displayName ?? '';
    _personalEmailController.text = employee.personalEmail ?? '';
    _companyEmailController.text = employee.companyEmail ?? '';
    _phoneController.text = employee.phone ?? '';
    _titleController.text = employee.employeeTitle ?? '';
    _positionController.text = employee.employeePosition ?? '';
    _startDateController.text = employee.startDate ?? '';
    _endDateController.text = employee.endDate ?? '';
    _selectedRoleId = employee.roleId;
    _employmentType = employee.employmentType ?? 'full_time';
    _status = employee.employeeStatus;
    _isSales = employee.isSales;
    _tracksHours = employee.tracksHours;
    _onVehicleInsurance = employee.onVehicleInsurance;
    _hasCompanyCard = employee.hasCompanyCard;
  }

  void _maybeSuggestDisplayName() {
    if (_displayNameController.text.trim().isNotEmpty) {
      return;
    }

    setState(() {});
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final org = ref.read(orgProvider).valueOrNull;
    if (org == null) {
      return;
    }

    final roleId = _selectedRoleId;
    if (roleId == null || roleId.isEmpty) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final service = ref.read(employeeServiceProvider);

      final values = <String, dynamic>{
        'role_id': roleId,
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'display_name': _displayNameController.text.trim().isEmpty
            ? null
            : _displayNameController.text.trim(),
        'personal_email': _personalEmailController.text.trim().isEmpty
            ? null
            : _personalEmailController.text.trim(),
        'company_email': _companyEmailController.text.trim().isEmpty
            ? null
            : _companyEmailController.text.trim(),
        'phone': _phoneController.text.trim().isEmpty
            ? null
            : _phoneController.text.trim(),
        'employee_title': _titleController.text.trim().isEmpty
            ? null
            : _titleController.text.trim(),
        'employee_position': _positionController.text.trim().isEmpty
            ? null
            : _positionController.text.trim(),
        'employment_type': _employmentType,
        'employee_status': _status,
        'start_date': _startDateController.text.trim().isEmpty
            ? null
            : _startDateController.text.trim(),
        'end_date': _endDateController.text.trim().isEmpty
            ? null
            : _endDateController.text.trim(),
        'is_sales': _isSales,
        'tracks_hours': _tracksHours,
        'on_vehicle_insurance': _onVehicleInsurance,
        'has_company_card': _hasCompanyCard,
      };

      final employee = widget.isEdit
          ? await service.updateEmployee(
              orgId: org.orgId,
              employeeId: widget.employeeId!,
              values: values,
            )
          : await service.createEmployee(orgId: org.orgId, values: values);

      final canViewComp = ref.read(hasPermissionProvider('compensation.view'));
      final payRate = double.tryParse(_payRateController.text.trim());
      if (canViewComp.valueOrNull == true && payRate != null) {
        final effectiveDate = _startDateController.text.trim().isEmpty
            ? DateTime.now().toIso8601String().split('T').first
            : _startDateController.text.trim();

        final currentEmployee = ref.read(currentEmployeeProvider).valueOrNull;
        await service.addCompensation(
          orgId: org.orgId,
          employeeId: employee.id,
          payType: _payType,
          payRate: payRate,
          effectiveDate: effectiveDate,
          createdBy: currentEmployee?.id,
          reason: widget.isEdit ? 'Compensation updated' : 'Initial entry',
        );
      }

      ref.invalidate(employeeListProvider);
      ref.invalidate(employeeDetailProvider(employee.id));

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save employee: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}
