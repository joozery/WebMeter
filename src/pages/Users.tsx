import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { apiClient, users as usersApi, roles as rolesApi, permissions as permissionsApi, User as ApiUser, CreateUserRequest, handleApiError } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield,
  Mail,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings,
  Trash2,
  Edit3,
  Square,
  Check,
  Copy,
  UserX,
  Search,
  Key,
  Plus,
  Save,
  ZoomIn,
  Eye,
  EyeOff,
  UserCog
} from 'lucide-react';
import { FaUserShield } from "react-icons/fa";
import useCustomSwal from '@/utils/swal';

// Use API User interface instead of local interface
type User = ApiUser;

// Role and Permission interfaces
interface Permission {
  id: number;
  permission_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  permissions: Permission[];
}

interface CreateRoleRequest {
  name: string;
  description?: string;
}

type SortField = 'id' | 'name' | 'surname' | 'username' | 'email' | 'phone' | 'lineId' | 'address' | 'level' | 'status' | 'note';
type SortDirection = 'asc' | 'desc';

export default function Users() {
  const { showSuccessToast, showErrorToast, showConfirmDialog } = useCustomSwal();
  // API State Management
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Form State for Add Dialog
  const [newUserForm, setNewUserForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    name: '',
    surname: '',
    address: '',
    phone: '',
    lineId: '',
    level: 'Operator',
    status: 'active',
    note: ''
  });

  // Confirm password state
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Form State for Role Dialog  
  const [newRoleForm, setNewRoleForm] = useState<CreateRoleRequest>({
    name: ''
  });
  
  // UI State
  const [selectedTab, setSelectedTab] = useState('user');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditingField, setInlineEditingField] = useState<string | null>(null);
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<string>('engineer');
  const [customPermissions, setCustomPermissions] = useState<{[key: string]: {read: boolean, write: boolean}}>({});

  // Context menu and multi-selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [contextMenuRow, setContextMenuRow] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPermissionMenu, setShowPermissionMenu] = useState<boolean>(false);
  
  // Group expansion state for user levels
  const [expandedUserGroups, setExpandedUserGroups] = useState<Set<string>>(new Set());
  
  // Group expansion state for permission groups
  const [expandedPermissionGroups, setExpandedPermissionGroups] = useState<Set<string>>(new Set());

  // Authorize tab state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<{[key: string]: {[module: string]: {read: boolean, write: boolean, report: boolean}}}>({
    Admin: {
      'Dashboard': { read: true, write: true, report: true },
      'Online Data': { read: true, write: true, report: true },
      'Table Data': { read: true, write: true, report: true },
      'Graph Data': { read: true, write: true, report: true },
      'Compare Graph': { read: true, write: true, report: true },
      'Energy Graph': { read: true, write: true, report: true },
      'Demand Graph': { read: true, write: true, report: true },
      'Line Graph': { read: true, write: true, report: true },
      'TOU Compare': { read: true, write: true, report: true },
      'TOU Energy': { read: true, write: true, report: true },
      'TOU Demand': { read: true, write: true, report: true },
      'Export': { read: true, write: true, report: true },
      'Event': { read: true, write: true, report: true },
      'Meter Tree': { read: true, write: true, report: true },
      'Config': { read: true, write: true, report: true },
      'Email - Email List': { read: true, write: true, report: true },
      'Email - Setup & Edit': { read: true, write: true, report: true },
      'User Management': { read: true, write: true, report: true },
      'User Permissions': { read: true, write: true, report: true }
    },
    Manager: {
      'Dashboard': { read: true, write: true, report: true },
      'Online Data': { read: true, write: true, report: true },
      'Table Data': { read: true, write: true, report: true },
      'Graph Data': { read: true, write: true, report: true },
      'Compare Graph': { read: true, write: true, report: true },
      'Energy Graph': { read: true, write: true, report: true },
      'Demand Graph': { read: true, write: true, report: true },
      'Line Graph': { read: true, write: true, report: true },
      'TOU Compare': { read: true, write: true, report: true },
      'TOU Energy': { read: true, write: true, report: true },
      'TOU Demand': { read: true, write: true, report: true },
      'Export': { read: true, write: true, report: true },
      'Event': { read: true, write: true, report: true },
      'Meter Tree': { read: true, write: true, report: true },
      'Config': { read: true, write: true, report: true },
      'Email - Email List': { read: true, write: true, report: true },
      'Email - Setup & Edit': { read: false, write: false, report: false },
      'User Management': { read: true, write: true, report: true },
      'User Permissions': { read: false, write: false, report: false }
    },
    Supervisor: {
      'Dashboard': { read: true, write: true, report: true },
      'Online Data': { read: true, write: true, report: true },
      'Table Data': { read: true, write: true, report: true },
      'Graph Data': { read: true, write: true, report: true },
      'Compare Graph': { read: true, write: true, report: true },
      'Energy Graph': { read: true, write: true, report: true },
      'Demand Graph': { read: true, write: true, report: true },
      'Line Graph': { read: true, write: true, report: true },
      'TOU Compare': { read: true, write: true, report: true },
      'TOU Energy': { read: true, write: true, report: true },
      'TOU Demand': { read: true, write: true, report: true },
      'Export': { read: true, write: true, report: true },
      'Event': { read: true, write: true, report: true },
      'Meter Tree': { read: true, write: true, report: true },
      'Config': { read: false, write: false, report: false },
      'Email - Email List': { read: true, write: true, report: true },
      'Email - Setup & Edit': { read: false, write: false, report: false },
      'User Management': { read: false, write: false, report: false },
      'User Permissions': { read: false, write: false, report: false }
    },
    Engineer: {
      'Dashboard': { read: true, write: true, report: true },
      'Online Data': { read: true, write: true, report: true },
      'Table Data': { read: true, write: true, report: true },
      'Graph Data': { read: true, write: true, report: true },
      'Compare Graph': { read: true, write: true, report: true },
      'Energy Graph': { read: true, write: true, report: true },
      'Demand Graph': { read: true, write: true, report: true },
      'Line Graph': { read: true, write: true, report: true },
      'TOU Compare': { read: true, write: true, report: true },
      'TOU Energy': { read: true, write: true, report: true },
      'TOU Demand': { read: true, write: true, report: true },
      'Export': { read: true, write: true, report: true },
      'Event': { read: true, write: true, report: true },
      'Meter Tree': { read: false, write: false, report: false },
      'Config': { read: false, write: false, report: false },
      'Email - Email List': { read: true, write: true, report: true },
      'Email - Setup & Edit': { read: false, write: false, report: false },
      'User Management': { read: false, write: false, report: false },
      'User Permissions': { read: false, write: false, report: false }
    },
    Operator: {
      'Dashboard': { read: true, write: true, report: true },
      'Online Data': { read: false, write: false, report: false },
      'Table Data': { read: false, write: false, report: false },
      'Graph Data': { read: false, write: false, report: false },
      'Compare Graph': { read: false, write: false, report: false },
      'Energy Graph': { read: false, write: false, report: false },
      'Demand Graph': { read: false, write: false, report: false },
      'Line Graph': { read: false, write: false, report: false },
      'TOU Compare': { read: false, write: false, report: false },
      'TOU Energy': { read: false, write: false, report: false },
      'TOU Demand': { read: false, write: false, report: false },
      'Export': { read: true, write: true, report: true },
      'Event': { read: false, write: false, report: false },
      'Meter Tree': { read: false, write: false, report: false },
      'Config': { read: false, write: false, report: false },
      'Email - Email List': { read: false, write: false, report: false },
      'Email - Setup & Edit': { read: false, write: false, report: false },
      'User Management': { read: false, write: false, report: false },
      'User Permissions': { read: false, write: false, report: false }
    }
  });
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [showAddRoleDialog, setShowAddRoleDialog] = useState<boolean>(false);
  
  // Authorize tab sorting state
  const [authorizeSortField, setAuthorizeSortField] = useState<'no' | 'page' | 'view' | 'edit' | 'report' | null>(null);
  const [authorizeSortDirection, setAuthorizeSortDirection] = useState<'asc' | 'desc'>('asc');

  // API Functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersApi.getAll({
        search: searchTerm,
        sortBy: sortField || 'id',
        sortOrder: sortDirection.toUpperCase() as 'ASC' | 'DESC',
        page: 1,
        limit: 100
      });
      
      if (response.success && response.data) {
        console.log('Debug - Users API response:', response.data);
        console.log('Debug - First user data:', response.data[0]);
        setUsers(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      
      if (response.success) {
        setUserRoles(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch roles');
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionsApi.getAll();
      
      if (response.success) {
        setPermissions(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch permissions');
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  // Load users on component mount and when search/sort changes
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, sortField, sortDirection]);

  // Load roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Handle clicking outside permission menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPermissionMenu) {
        setShowPermissionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPermissionMenu]);

  // Set default selected role when userRoles are loaded
  useEffect(() => {
    if (userRoles.length > 0 && !selectedRole) {
      const firstRoleName = userRoles[0].name;
      setSelectedRole(firstRoleName);
      setRolePermissions(prev => {
        if (prev[firstRoleName]) return prev;
        // initialize empty permission map for unknown roles
        return { ...prev, [firstRoleName]: {} } as any;
      });
    }
  }, [userRoles, selectedRole]);

  // Auto-expand permission groups when users are loaded
  useEffect(() => {
    if (users.length > 0) {
      const userLevels = Array.from(new Set(users.map(user => user.level || user.role_name || 'Unknown'))).filter(Boolean);
      setExpandedPermissionGroups(new Set(userLevels));
    }
  }, [users]);

  // API Functions for User Operations
  const handleCreateUser = async () => {
    try {
      setLoading(true);
      
      const response = await usersApi.create(newUserForm);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        setIsAddDialogOpen(false);
        setNewUserForm({
          username: '',
          email: '',
          password: '',
          name: '',
          surname: '',
          address: '',
          phone: '',
          lineId: '',
          level: 'Operator',
          status: 'active',
          note: ''
        });
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to create user');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to create user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserAPI = async (updatedUser: User) => {
    try {
      setLoading(true);
      
      // Prepare update data - exclude fields that shouldn't be updated
      const { id, created_at, updated_at, last_login, role_name, ...updateData } = updatedUser;
      
      // Ensure required fields are present
      const finalUpdateData = {
        username: updateData.username,
        email: updateData.email,
        name: updateData.name,
        surname: updateData.surname || '',
        address: updateData.address,
        phone: updateData.phone,
        lineId: updateData.lineId,
        level: updateData.level,
        status: updateData.status,
        note: updateData.note
      };
      
      console.log('Sending update data:', finalUpdateData); // Debug log
      console.log('User ID:', id); // Debug log
      
      const response = await usersApi.update(id, finalUpdateData);
      
      console.log('API Response:', response); // Debug log
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to update user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Role Management Functions
  const handleCreateRole = async () => {
    try {
      setLoading(true);
      
      const response = await rolesApi.create(newRoleForm);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        setIsAddRoleDialogOpen(false);
        setNewRoleForm({
          name: ''
        });
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to create role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      console.error('Failed to create role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    try {
      setLoading(true);
      
              const response = await rolesApi.update(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description
      });
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        setIsEditRoleDialogOpen(false);
        setEditingRole(null);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to update role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      console.error('Failed to update role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoleAPI = async (roleId: number) => {
    try {
      const { isConfirmed } = await showConfirmDialog({ title: 'Are you sure?', text: 'Are you sure you want to delete this role? This action cannot be undone.', icon: 'warning', confirmButtonText: 'Yes, delete it!' });
      if (!isConfirmed) {
        return;
      }
      
      setLoading(true);
      
      const response = await rolesApi.delete(roleId);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to delete role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
      console.error('Failed to delete role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const message = newStatus === 'inactive' 
        ? 'Are you sure you want to deactivate this user?' 
        : 'Are you sure you want to activate this user?';
      
      const { isConfirmed } = await showConfirmDialog({ title: 'Confirm status change', text: message, icon: 'warning', confirmButtonText: 'Yes, proceed' });
      if (!isConfirmed) {
        return;
      }
      
      setLoading(true);
      
      const response = await usersApi.updateStatus(userId, newStatus);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to update user status');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to update user status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserPermissionByRole = async (userId: number, roleName: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const message = `Are you sure you want to set ${user.name} ${user.surname}'s permissions based on the "${roleName}" role?`;
      
      const { isConfirmed } = await showConfirmDialog({ title: 'Confirm role change', text: message, icon: 'warning', confirmButtonText: 'Yes, update' });
      if (!isConfirmed) {
        return;
      }
      
      setLoading(true);
      
      // Only update the level to avoid validation errors
      const response = await usersApi.update(userId, {
        level: roleName as User['level']
      });
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to update user permissions');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to update user permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAuthorizeSort = (field: 'no' | 'page' | 'view' | 'edit' | 'report') => {
    if (authorizeSortField === field) {
      setAuthorizeSortDirection(authorizeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAuthorizeSortField(field);
      setAuthorizeSortDirection('asc');
    }
  };

  const getSortedUsers = () => {
    // First filter by search term
    let filteredUsers = users;
    if (searchTerm.trim()) {
      filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.name} ${user.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.lineId || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.address || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.level || user.role_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.note || '')?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Only sort if a sort field is selected
    if (!sortField) {
      return filteredUsers;
    }

    // Then sort the filtered results
    return [...filteredUsers].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Handle level sorting by priority
      if (sortField === 'level') {
        // Create dynamic level priority based on userRoles order
        const levelPriority = userRoles.reduce((acc, role, index) => {
          acc[role.name] = index + 1;
          return acc;
        }, {} as Record<string, number>);
        aValue = levelPriority[aValue as string] || userRoles.length + 1;
        bValue = levelPriority[bValue as string] || userRoles.length + 1;
      }

      // Handle status sorting by priority (active first)
      if (sortField === 'status') {
        const statusPriority = { 'active': 1, 'inactive': 2 };
        aValue = statusPriority[aValue as keyof typeof statusPriority] || 3;
        bValue = statusPriority[bValue as keyof typeof statusPriority] || 3;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Group users by their access level
  const getGroupedUsers = () => {
    const sortedUsers = getSortedUsers();
    const grouped = new Map<string, User[]>();
          const levelOptions = userRoles.map(role => role.name);
    
    levelOptions.forEach(level => {
              const usersInLevel = sortedUsers.filter(user => (user.level || user.role_name) === level);
      if (usersInLevel.length > 0) {
        grouped.set(level, usersInLevel);
      }
    });
    
    return grouped;
  };
  
  // Toggle user group expansion
  const toggleUserGroup = (groupName: string) => {
    setExpandedUserGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Toggle permission group expansion
  const togglePermissionGroup = (groupName: string) => {
    setExpandedPermissionGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Get users grouped by permission level
  const getGroupedUsersByPermission = () => {
    const sortedUsers = getSortedUsers();
    const grouped = new Map<string, User[]>();
    
    // Get all unique levels from actual users data, handle undefined levels
    const userLevels = Array.from(new Set(sortedUsers.map(user => user.level || user.role_name || 'Unknown'))).filter(Boolean);
    
    console.log('Debug Permissions Tab - Total users:', users.length);
    console.log('Debug Permissions Tab - Sorted users:', sortedUsers.length);
    console.log('Debug Permissions Tab - User levels found:', userLevels);
    console.log('Debug Permissions Tab - Sample user levels:', sortedUsers.slice(0, 3).map(u => ({ id: u.id, level: u.level, role_name: u.role_name })));
    
    // Group users by their actual level
    userLevels.forEach(level => {
      const usersInLevel = sortedUsers.filter(user => (user.level || user.role_name || 'Unknown') === level);
      if (usersInLevel.length > 0) {
        grouped.set(level, usersInLevel);
        console.log(`Debug Permissions Tab - Level ${level}: ${usersInLevel.length} users`);
      }
    });
    
    console.log('Debug Permissions Tab - Final grouped data:', grouped);
    return grouped;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const getLevelBadge = (level: string | undefined) => {
    if (!level) {
      return (
        <Badge className="bg-gray-500 text-white rounded-none">
          <UsersIcon className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
    }
    
    switch (level) {
      case 'Admin':
        return (
          <Badge className="bg-destructive text-destructive-foreground rounded-none">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'Manager':
        return (
          <Badge className="bg-orange-500 text-white rounded-none">
            <UsersIcon className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        );
      case 'Supervisor':
        return (
          <Badge className="bg-blue-500 text-white rounded-none">
            <UsersIcon className="w-3 h-3 mr-1" />
            Supervisor
          </Badge>
        );
      case 'Engineer':
        return (
          <Badge className="bg-green-500 text-white rounded-none">
            <UsersIcon className="w-3 h-3 mr-1" />
            Engineer
          </Badge>
        );
      case 'Operator':
        return (
          <Badge className="bg-purple-500 text-white rounded-none">
            <UsersIcon className="w-3 h-3 mr-1" />
            Operator
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white rounded-none">
            <UsersIcon className="w-3 h-3 mr-1" />
            {level || 'Unknown'}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string, userId: number) => {
    return (
      <div 
        className={`flex items-center justify-center ${!isMultiSelectMode ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => {
          if (!isMultiSelectMode) {
            handleStatusToggle(userId, status as 'active' | 'inactive');
          }
        }}
        title={!isMultiSelectMode ? `Click to ${status === 'active' ? 'deactivate' : 'activate'} user` : ''}
      >
        <div className={`w-3 h-3 rounded-full transition-transform ${
          status === 'active' ? 'bg-green-500' : 'bg-red-500'
        } ${!isMultiSelectMode ? 'hover:scale-110' : ''}`}></div>
      </div>
    );
  };

  const InlineEditCell = ({ 
    user, 
    field, 
    value, 
    isEditing, 
    className = "text-xs" 
  }: {
    user: User;
    field: keyof User;
    value: string;
    isEditing: boolean;
    className?: string;
  }) => {
    if (isEditing) {
      if (field === 'status') {
        return (
          <td className={className}>
            <Select 
              value={value}
              onValueChange={(newValue) => {
                handleInlineEdit(user.id, field, newValue);
                handleInlineEditComplete();
              }}
            >
              <SelectTrigger className="h-6 text-xs rounded-none border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </td>
        );
      } else {
        return (
          <td className={className}>
            <Input
              value={value}
              onChange={(e) => handleInlineEdit(user.id, field, e.target.value)}
              onBlur={handleInlineEditComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineEditComplete();
                if (e.key === 'Escape') handleInlineEditComplete();
              }}
              className="h-6 text-xs rounded-none border-primary"
              autoFocus
            />
          </td>
        );
      }
    }
    
    return (
      <td 
        className={`${className} ${!isMultiSelectMode ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
        onDoubleClick={() => handleDoubleClick(user.id, field)}
        title={!isMultiSelectMode ? "Double-click to edit" : ""}
      >
        {field === 'email' && (
          <div className="flex items-center space-x-1">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground text-xs">{value}</span>
          </div>
        )}
        {field === 'address' && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground text-xs">{value}</span>
          </div>
        )}
        {!['email', 'address'].includes(field) && (
          <span className="text-foreground text-xs">{value}</span>
        )}
      </td>
    );
  };

  const handleEditUser = (user: User) => {
    console.log('handleEditUser called with user:', user); // Debug log
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const { isConfirmed } = await showConfirmDialog({ title: 'Delete user?', text: 'Are you sure you want to delete this user?', icon: 'warning', confirmButtonText: 'Yes, delete' });
      if (!isConfirmed) {
        return;
      }
      
      setLoading(true);
      
      const response = await usersApi.delete(id);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to delete user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = () => {
    console.log('handleUpdateUser called with editingUser:', editingUser); // Debug log
    if (editingUser) {
      handleUpdateUserAPI(editingUser);
    } else {
      console.error('editingUser is null or undefined');
    }
  };

  const handleDoubleClick = (userId: number, field: string) => {
    // Prevent inline editing when in multi-select mode
    if (isMultiSelectMode) {
      return;
    }
    
    if (['name', 'username', 'email', 'phone', 'lineId', 'address', 'note', 'status'].includes(field)) {
      setInlineEditingId(userId);
      setInlineEditingField(field);
    }
  };

  const handleRightClick = (user: User) => {
    setContextMenuRow(user);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(user.id)) {
        newSet.delete(user.id);
      } else {
        newSet.add(user.id);
      }
      return newSet;
    });
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedUsers(new Set());
      // Cancel any ongoing inline editing
      setInlineEditingId(null);
      setInlineEditingField(null);
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
    const message = status === 'inactive' 
      ? `Are you sure you want to deactivate ${selectedUsersList.length} user(s)?`
      : `Are you sure you want to activate ${selectedUsersList.length} user(s)?`;
    
    const { isConfirmed } = await showConfirmDialog({ title: 'Confirm bulk action', text: message, icon: 'warning', confirmButtonText: 'Yes, proceed' });
    if (isConfirmed) {
      setUsers(users.map(user => 
        selectedUsers.has(user.id) ? { ...user, status } : user
      ));
      setSelectedUsers(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
    const { isConfirmed } = await showConfirmDialog({ title: 'Delete selected users?', text: `Are you sure you want to delete ${selectedUsersList.length} user(s)? This action cannot be undone.`, icon: 'warning', confirmButtonText: 'Yes, delete' });
    if (isConfirmed) {
      setUsers(users.filter(user => !selectedUsers.has(user.id)));
      setSelectedUsers(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleBulkLevelChange = async (level: User['level']) => {
    const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
    const { isConfirmed } = await showConfirmDialog({ title: 'Change level?', text: `Are you sure you want to change the access level of ${selectedUsersList.length} user(s) to ${level}?`, icon: 'warning', confirmButtonText: 'Yes, change' });
    if (isConfirmed) {
      setUsers(users.map(user => 
        selectedUsers.has(user.id) ? { ...user, level } : user
      ));
      setSelectedUsers(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleSingleUserLevelChange = async (userId: number, level: User['level']) => {
    const user = users.find(u => u.id === userId);
    const { isConfirmed } = await showConfirmDialog({ title: 'Change level?', text: user ? `Are you sure you want to change ${user.name} ${user.surname}'s access level to ${level}?` : `Change level to ${level}?`, icon: 'warning', confirmButtonText: 'Yes, change' });
    if (user && isConfirmed) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, level } : u
      ));
    }
  };

  const handleInlineEdit = (userId: number, field: keyof User, value: string) => {
    // Update local state immediately for responsive UI
    setUsers(users.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  const handleInlineEditComplete = async () => {
    if (inlineEditingId && inlineEditingField) {
      const user = users.find(u => u.id === inlineEditingId);
      if (user) {
        try {
          const { id, created_at, updated_at, last_login, role_name, ...updateData } = user;
          await usersApi.update(id, updateData);
          // Refresh to get latest data from server
          await fetchUsers();
        } catch (err) {
          const errorMessage = handleApiError(err);
          setError(errorMessage);
          console.error('Failed to update user:', err);
          // Refresh to revert changes on error
          await fetchUsers();
        }
      }
    }
    setInlineEditingId(null);
    setInlineEditingField(null);
  };

  const handleStatusToggle = (userId: number, currentStatus: 'active' | 'inactive') => {
    handleToggleUserStatus(userId, currentStatus);
  };

  const getPermissionsByLevel = (level: string) => {
    const baseModules = [
      'Dashboard',
      'Online Data', 
      'Table Data',
      'Graph Data',
      'Compare Graph',
      'Energy Graph',
      'Demand Graph', 
      'Line Graph',
      'TOU Compare',
      'TOU Energy',
      'TOU Demand',
      'Export',
      'Event',
      'Meter Tree',
      'Config',
      'Email - Email List',
      'Email - Setup & Edit',
      'User Management',
      'User Permissions'
    ];

    let defaultPermissions;
    switch (level.toLowerCase()) {
      case 'admin':
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: true, 
          write: true 
        }));
        break;
      
      case 'manager':
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: true, 
          write: !['User Permissions', 'Email - Setup & Edit'].includes(module)
        }));
        break;
      
      case 'supervisor':
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: !['User Management', 'User Permissions'].includes(module), 
          write: !['User Management', 'User Permissions', 'Email - Setup & Edit'].includes(module)
        }));
        break;
      
      case 'engineer':
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: !['User Management', 'User Permissions', 'Config'].includes(module), 
          write: !['User Management', 'User Permissions', 'Email - Setup & Edit', 'Meter Tree', 'Config'].includes(module)
        }));
        break;
      
      case 'operator':
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: ['Dashboard', 'Export'].includes(module), 
          write: ['Dashboard', 'Export'].includes(module)
        }));
        break;
      
      default:
        defaultPermissions = baseModules.map(module => ({ 
          module, 
          read: false, 
          write: false 
        }));
    }

    // Apply custom permissions if they exist
    return defaultPermissions.map(permission => {
      const customKey = `${level}-${permission.module}`;
      if (customPermissions[customKey]) {
        return {
          ...permission,
          read: customPermissions[customKey].read,
          write: customPermissions[customKey].write
        };
      }
      return permission;
    });
  };

  const handleCustomPermissionChange = (module: string, type: 'read' | 'write', value: boolean) => {
    const customKey = `${selectedPermissionLevel}-${module}`;
    setCustomPermissions(prev => ({
      ...prev,
      [customKey]: {
        ...prev[customKey],
        read: type === 'read' ? value : prev[customKey]?.read ?? getDefaultPermission(module, 'read'),
        write: type === 'write' ? value : prev[customKey]?.write ?? getDefaultPermission(module, 'write')
      }
    }));
  };

  const getDefaultPermission = (module: string, type: 'read' | 'write'): boolean => {
    const defaultPerms = getPermissionsByLevel(selectedPermissionLevel);
    const perm = defaultPerms.find(p => p.module === module);
    return perm ? perm[type] : false;
  };

  const resetPermissions = () => {
    setCustomPermissions({});
  };

  // Authorize tab functions
  const handlePermissionChange = (role: string, module: string, type: 'read' | 'write' | 'report', value: boolean) => {
    setRolePermissions(prev => {
      const existingRole = prev[role] || {} as any;
      const existingModule = existingRole[module] || { read: false, write: false, report: false };
      return {
        ...prev,
        [role]: {
          ...existingRole,
          [module]: {
            ...existingModule,
            [type]: value
          }
        }
      };
    });
  };

  const handleAddRole = () => {
            if (newRoleName.trim() && !userRoles.map(role => role.name).includes(newRoleName.trim())) {
      // This is deprecated - use API instead
      console.warn('Use handleCreateRole API instead');
      setRolePermissions(prev => ({
        ...prev,
        [newRoleName.trim()]: {
          'Dashboard': { read: false, write: false, report: false },
          'Online Data': { read: false, write: false, report: false },
          'Table Data': { read: false, write: false, report: false },
          'Graph Data': { read: false, write: false, report: false },
          'Compare Graph': { read: false, write: false, report: false },
          'Energy Graph': { read: false, write: false, report: false },
          'Demand Graph': { read: false, write: false, report: false },
          'Line Graph': { read: false, write: false, report: false },
          'TOU Compare': { read: false, write: false, report: false },
          'TOU Energy': { read: false, write: false, report: false },
          'TOU Demand': { read: false, write: false, report: false },
          'Export': { read: false, write: false, report: false },
          'Event': { read: false, write: false, report: false },
          'Meter Tree': { read: false, write: false, report: false },
          'Config': { read: false, write: false, report: false },
          'Email - Email List': { read: false, write: false, report: false },
          'Email - Setup & Edit': { read: false, write: false, report: false },
          'User Management': { read: false, write: false, report: false },
          'User Permissions': { read: false, write: false, report: false }
        }
      }));
      setNewRoleName('');
      setShowAddRoleDialog(false);
    }
  };

  const handleDeleteRole = async (roleToDelete: string) => {
    const { isConfirmed } = await showConfirmDialog({ title: 'Delete role?', text: `Are you sure you want to delete the role "${roleToDelete}"?`, icon: 'warning', confirmButtonText: 'Yes, delete' });
    if (isConfirmed) {
      // This is deprecated - use handleDeleteRoleAPI instead
      console.warn('Use handleDeleteRoleAPI instead');
      setRolePermissions(prev => {
        const newPermissions = { ...prev };
        delete newPermissions[roleToDelete];
        return newPermissions;
      });
      if (selectedRole === roleToDelete) {
        setSelectedRole(userRoles[0]?.name || '');
      }
    }
  };

  const modules = [
    'Dashboard',
    'Online Data',
    'Table Data',
    'Graph Data',
    'Compare Graph',
    'Energy Graph',
    'Demand Graph',
    'Line Graph',
    'TOU Compare',
    'TOU Energy',
    'TOU Demand',
    'Export',
    'Event',
    'Meter Tree',
    'Config',
    'Email - Email List',
    'Email - Setup & Edit',
    'User Management',
    'User Permissions'
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-9xl mx-auto">
          <div className="bg-white rounded-none shadow-sm">
            {/* User Management Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <UsersIcon className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
              </div>
            </div>

            <Tabs defaultValue="user" className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 px-0 pt-0">
                <TabsList className="h-10 p-1 bg-gray-100 rounded-none">
                  <TabsTrigger 
                    value="user" 
                    className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-none"
                  >
                    User List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="grant" 
                    className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-none"
                  >
                    Permissions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="authorize" 
                    className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-none"
                  >
                    Authorize
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* User List Tab */}
              <TabsContent value="user" className="p-6 space-y-4">
                <div className="flex items-center justify-between -mt-2 mb-4">
                  {/* Bulk Actions */}
                  {isMultiSelectMode && selectedUsers.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {selectedUsers.size} user(s) selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange('active')}
                        className="text-xs h-7 rounded-none"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Activate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange('inactive')}
                        className="text-xs h-7 rounded-none"
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Deactivate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="text-xs h-7 rounded-none text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 ml-auto">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 h-8 text-xs rounded-none border-gray-300 min-w-64"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="text-xs h-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-none">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Add User
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl rounded-none border-none max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Show error message if any */}
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            {error}
                          </div>
                        )}
                        
                        {/* Horizontal Form Layout */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name-Lastname</Label>
                            <Input 
                              id="name" 
                              placeholder="Enter full name" 
                              className="rounded-none"
                              value={`${newUserForm.name} ${newUserForm.surname}`.trim()}
                              onChange={(e) => {
                                const fullName = e.target.value.trim();
                                const parts = fullName.split(' ').filter(part => part.length > 0);
                                const firstName = parts[0] || '';
                                const lastName = parts.slice(1).join(' ') || '';
                                setNewUserForm({...newUserForm, name: firstName, surname: lastName});
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                              id="username" 
                              placeholder="Enter username" 
                              className="rounded-none"
                              value={newUserForm.username}
                              onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="user@example.com" 
                              className="rounded-none"
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input 
                              id="phone" 
                              placeholder="Enter phone number" 
                              className="rounded-none"
                              value={newUserForm.phone}
                              onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lineId">Line ID</Label>
                            <Input 
                              id="lineId" 
                              placeholder="Enter Line ID" 
                              className="rounded-none"
                              value={newUserForm.lineId}
                              onChange={(e) => setNewUserForm({...newUserForm, lineId: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="level">Access Level</Label>
                            <Select 
                              value={newUserForm.level.toLowerCase()} 
                              onValueChange={(value) => setNewUserForm({...newUserForm, level: value.charAt(0).toUpperCase() + value.slice(1) as 'Admin' | 'Manager' | 'Supervisor' | 'Engineer' | 'Operator'})}
                            >
                              <SelectTrigger className="rounded-none">
                                <SelectValue placeholder="Select access level" />
                              </SelectTrigger>
                              <SelectContent className="rounded-none">
                                {userRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                              <Input 
                                id="password" 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password" 
                                className="rounded-none pr-10"
                                value={newUserForm.password}
                                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                              <Input 
                                id="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password" 
                                className="rounded-none pr-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input 
                            id="address" 
                            placeholder="User address" 
                            className="rounded-none"
                            value={newUserForm.address}
                            onChange={(e) => setNewUserForm({...newUserForm, address: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="note">Note</Label>
                          <Input 
                            id="note" 
                            placeholder="Additional notes or comments" 
                            className="rounded-none"
                            value={newUserForm.note}
                            onChange={(e) => setNewUserForm({...newUserForm, note: e.target.value})}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsAddDialogOpen(false);
                              setError(null);
                              setConfirmPassword('');
                              setShowPassword(false);
                              setShowConfirmPassword(false);
                            }} 
                            className="rounded-none"
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateUser} 
                            className="rounded-none"
                            disabled={loading || !newUserForm.username || !newUserForm.email || !newUserForm.password || !newUserForm.name || newUserForm.password !== confirmPassword}
                          >
                            {loading ? 'Creating...' : 'Create User'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit User Dialog */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-4xl rounded-none border-none max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                          Update user account information and permissions.
                        </DialogDescription>
                      </DialogHeader>
                      {editingUser && (
                        <div className="space-y-4">
                          {/* Show error message if any */}
                          {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                              {error}
                            </div>
                          )}
                          
                          {/* Horizontal Form Layout */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name-Lastname</Label>
                              <Input 
                                id="edit-name" 
                                value={`${editingUser.name} ${editingUser.surname}`.trim()}
                                onChange={(e) => {
                                  const fullName = e.target.value.trim();
                                  const parts = fullName.split(' ').filter(part => part.length > 0);
                                  const firstName = parts[0] || '';
                                  const lastName = parts.slice(1).join(' ') || '';
                                  setEditingUser({...editingUser, name: firstName, surname: lastName});
                                }}
                                className="rounded-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-username">Username</Label>
                              <Input 
                                id="edit-username" 
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                className="rounded-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input 
                                id="edit-email" 
                                type="email" 
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                className="rounded-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Phone</Label>
                              <Input 
                                id="edit-phone" 
                                value={editingUser.phone || ''}
                                onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                className="rounded-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-lineId">Line ID</Label>
                              <Input 
                                id="edit-lineId" 
                                value={editingUser.lineId || ''}
                                onChange={(e) => setEditingUser({...editingUser, lineId: e.target.value})}
                                className="rounded-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-level">Access Level</Label>
                              <Select 
                                value={(editingUser.level || editingUser.role_name || 'Operator').toLowerCase()} 
                                onValueChange={(value) => setEditingUser({...editingUser, level: value.charAt(0).toUpperCase() + value.slice(1) as User['level']})}
                              >
                                <SelectTrigger className="rounded-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                  {userRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select 
                                value={editingUser.status} 
                                onValueChange={(value) => setEditingUser({...editingUser, status: value as 'active' | 'inactive'})}
                              >
                                <SelectTrigger className="rounded-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Input 
                                id="edit-address" 
                                value={editingUser.address || ''}
                                onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                                className="rounded-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-note">Note</Label>
                            <Input 
                              id="edit-note" 
                              value={editingUser.note || ''}
                              onChange={(e) => setEditingUser({...editingUser, note: e.target.value})}
                              className="rounded-none"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingUser(null);
                                setError(null);
                              }} 
                              className="rounded-none"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleUpdateUser} 
                              className="rounded-none"
                              disabled={loading || !editingUser.username || !editingUser.email || !editingUser.name}
                            >
                              {loading ? 'Updating...' : 'Update User'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    <div className="flex items-center">
                      <span className="font-medium">Error:</span>
                      <span className="ml-2">{error}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError(null);
                          fetchUsers();
                        }}
                        className="ml-auto text-xs h-6 rounded-none"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* User List Table */}
                <div className="border border-gray-200 rounded-none overflow-hidden">
                  {loading && (
                    <div className="bg-blue-50 border-b border-blue-200 text-blue-700 px-4 py-2 text-sm">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                        Loading users...
                      </div>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider w-12 cursor-pointer hover:bg-gray-100 select-none">
                            <div className="flex items-center justify-center space-x-1" onClick={() => handleSort('id')}>
                              <span>No.</span>
                              {sortField === 'id' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className="w-3 h-3" /> : 
                                  <ChevronDown className="w-3 h-3" />
                              )}
                            </div>
                          </th>
                                                      <SortableHeader field="username">User</SortableHeader>
                          <SortableHeader field="email">Email</SortableHeader>
                          <SortableHeader field="name">Name-Lastname</SortableHeader>
                          <SortableHeader field="phone">Phone</SortableHeader>
                          <SortableHeader field="lineId">Line ID</SortableHeader>
                          <SortableHeader field="address">Address</SortableHeader>
                          <SortableHeader field="level">Level</SortableHeader>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                            <div className="flex items-center justify-center space-x-1" onClick={() => handleSort('status')}>
                              <span>Active</span>
                              {sortField === 'status' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className="w-3 h-3" /> : 
                                  <ChevronDown className="w-3 h-3" />
                              )}
                            </div>
                          </th>
                          <SortableHeader field="note">Note</SortableHeader>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {!loading && getSortedUsers().length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <UsersIcon className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-sm font-medium">No users found</p>
                                <p className="text-xs text-gray-400">
                                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first user'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getSortedUsers().map((user, index) => (
                          <ContextMenu key={user.id}>
                            <ContextMenuTrigger asChild>
                              <tr 
                                className={`hover:bg-gray-50 cursor-pointer ${selectedUsers.has(user.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                onContextMenu={() => handleRightClick(user)}
                                onClick={() => {
                                  if (isMultiSelectMode) {
                                    handleSelectUser(user);
                                  }
                                }}
                              >
                                <td className="px-2 py-2 text-center w-12">
                                  {isMultiSelectMode && (
                                    <div 
                                      className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded cursor-pointer mr-2 ${
                                        selectedUsers.has(user.id) 
                                          ? 'bg-primary border-primary' 
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                      onClick={() => handleSelectUser(user)}
                                    >
                                      {selectedUsers.has(user.id) && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500">{index + 1}</span>
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'username' ? (
                                    <Input
                                      value={user.username}
                                      onChange={(e) => handleInlineEdit(user.id, 'username', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-gray-900 cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'username')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'username')}
                                    >
                                      {user.username}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'email' ? (
                                    <Input
                                      value={user.email}
                                      onChange={(e) => handleInlineEdit(user.id, 'email', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-primary cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'email')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'email')}
                                    >
                                      {user.email}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'name' ? (
                                    <Input
                                      value={`${user.name} ${user.surname}`}
                                      onChange={(e) => {
                                        const fullName = e.target.value;
                                        const parts = fullName.split(' ');
                                        const firstName = parts[0] || '';
                                        const lastName = parts.slice(1).join(' ') || '';
                                        handleInlineEdit(user.id, 'name', firstName);
                                        handleInlineEdit(user.id, 'surname', lastName);
                                      }}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-gray-900 cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'name')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'name')}
                                    >
                                      {`${user.name} ${user.surname}`}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'phone' ? (
                                    <Input
                                      value={user.phone || ''}
                                      onChange={(e) => handleInlineEdit(user.id, 'phone', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-gray-900 cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'phone')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'phone')}
                                    >
                                      {user.phone || ''}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'lineId' ? (
                                    <Input
                                      value={user.lineId || ''}
                                      onChange={(e) => handleInlineEdit(user.id, 'lineId', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-primary cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'lineId')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'lineId')}
                                    >
                                      {user.lineId || ''}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'address' ? (
                                    <Input
                                      value={user.address || ''}
                                      onChange={(e) => handleInlineEdit(user.id, 'address', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-gray-900 cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'address')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'address')}
                                    >
                                      {user.address || ''}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {getLevelBadge(user.level || (user as any).role_name)}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div 
                                    className={`inline-block w-3 h-3 rounded-sm cursor-pointer ${
                                      user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    onClick={() => handleStatusToggle(user.id, user.status)}
                                  ></div>
                                </td>
                                <td className="px-3 py-2">
                                  {inlineEditingId === user.id && inlineEditingField === 'note' ? (
                                    <Input
                                      value={user.note || ''}
                                      onChange={(e) => handleInlineEdit(user.id, 'note', e.target.value)}
                                      onBlur={handleInlineEditComplete}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditComplete();
                                        if (e.key === 'Escape') handleInlineEditComplete();
                                      }}
                                      className="h-6 text-xs rounded-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs text-gray-900 cursor-pointer"
                                      onClick={() => handleDoubleClick(user.id, 'note')}
                                      onDoubleClick={() => handleDoubleClick(user.id, 'note')}
                                    >
                                      {user.note || ''}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => handleEditUser(user)}>
                                <Edit3 className="w-3 h-3 mr-2" />
                                Edit
                              </ContextMenuItem>

                              <ContextMenuItem onClick={() => handleStatusToggle(user.id, user.status)}>
                                {user.status === 'active' ? (
                                  <>
                                    <UserX className="w-3 h-3 mr-2" />
                                    Set Inactive
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3 h-3 mr-2" />
                                    Set Active
                                  </>
                                )}
                              </ContextMenuItem>

                              {/* Permission Menu */}
                              {userRoles.map((role) => (
                                <ContextMenuItem 
                                  key={role.id}
                                  onClick={() => handleSetUserPermissionByRole(user.id, role.name)}
                                  className={(user.level || user.role_name) === role.name ? 'bg-blue-50 text-blue-700' : ''}
                                >
                                  <UserCog className="w-3 h-3 mr-2" />
                                  Set as {role.name}
                                  {(user.level || user.role_name) === role.name && (
                                    <Check className="w-3 h-3 ml-auto text-blue-600" />
                                  )}
                                </ContextMenuItem>
                              ))}

                              {isMultiSelectMode && selectedUsers.size > 0 && (
                                <>
                                  <ContextMenuItem onClick={() => handleBulkStatusChange('active')}>
                                    <Shield className="w-3 h-3 mr-2" />
                                    Activate Selected
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                                    <UserX className="w-3 h-3 mr-2" />
                                    Deactivate Selected
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={handleBulkDelete} className="text-red-600">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete Selected
                                  </ContextMenuItem>
                                </>
                              )}
                              <ContextMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="grant" className="p-6 space-y-4">
  {/* User List by Permission Groups */}
  <div className="space-y-4"> 
    {Array.from(getGroupedUsersByPermission().entries()).map(([level, usersInLevel], groupIndex) => (
      <div key={level} className="border border-gray-200 rounded-none bg-white">
        {/* Group Header */}
        <div 
          className="bg-gray-50 px-2 py-1.5 border-b border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
          onClick={() => togglePermissionGroup(level)}
        >
          <div className="flex items-center space-x-1.5">
            {expandedPermissionGroups.has(level) ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
            <UsersIcon className="w-3 h-3 text-gray-600" />
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-semibold text-gray-700">{level}</h3>
              <span className="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded text-[10px]">{groupIndex + 1}</span>
            </div>
          </div>
        </div>
        
        {/* Group Users Table - Show only when expanded */}
        {expandedPermissionGroups.has(level) && (
          <div className="bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-1.5 py-1 text-center text-xs font-semibold text-gray-500 tracking-wider">No.</th>
                  <th className="w-25 px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">User</th>
                  <th className="w-45 px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">Email</th>
                  <th className="w-35 px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">Name-Lastname</th>
                  <th className="w-35 px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">Address</th>
                  <th className="w-28 px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">Level</th>
                  <th className="w-30 px-2 py-1 text-center text-xs font-semibold text-gray-500 tracking-wider">Active</th>
                  <th className="w-auto px-2 py-1 text-left text-xs font-semibold text-gray-500 tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersInLevel.map((user, index) => (
                  <ContextMenu key={user.id}>
                    <ContextMenuTrigger asChild>
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onContextMenu={() => handleRightClick(user)}
                      >
                        <td className="w-12 px-1.5 py-1 text-center">
                          <span className="text-xs text-gray-500">{groupIndex + 1}.{index + 1}</span>
                        </td>
                        <td className="w-24 px-2 py-1">
                          <div className="truncate">
                            <span className="text-xs text-gray-900">{user.username}</span>
                          </div>
                        </td>
                        <td className="w-40 px-2 py-1">
                          <div className="truncate">
                            <span className="text-xs text-primary">{user.email}</span>
                          </div>
                        </td>
                        <td className="w-32 px-2 py-1">
                          <div className="truncate">
                            <span className="text-xs text-gray-900">{`${user.name} ${user.surname}`}</span>
                          </div>
                        </td>
                        <td className="w-32 px-2 py-1">
                          <div className="truncate">
                            <span className="text-xs text-gray-900">{user.address || ''}</span>
                          </div>
                        </td>
                        <td className="w-28 px-2 py-1">
                          <div className="truncate">
                            {getLevelBadge(user.level || (user as any).role_name)}
                          </div>
                        </td>
                        <td className="w-16 px-2 py-1 text-center">
                          <div 
                            className={`inline-block w-2.5 h-2.5 rounded-sm cursor-pointer ${
                              user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            onClick={() => handleStatusToggle(user.id, user.status)}
                          ></div>
                        </td>
                        <td className="w-auto px-2 py-1">
                          <div className="truncate">
                            <span className="text-xs text-gray-900">{user.note || ''}</span>
                          </div>
                        </td>
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleEditUser(user)}>
                        <Edit3 className="w-3 h-3 mr-2" />
                        Edit User
                      </ContextMenuItem>

                      <ContextMenuItem onClick={() => handleStatusToggle(user.id, user.status)}>
                        {user.status === 'active' ? (
                          <>
                            <UserX className="w-3 h-3 mr-2" />
                            Set Inactive
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 mr-2" />
                            Set Active
                          </>
                        )}
                      </ContextMenuItem>

                      {/* Permission Menu */}
                      {userRoles.map((role) => (
                        <ContextMenuItem 
                          key={role.id}
                          onClick={() => handleSetUserPermissionByRole(user.id, role.name)}
                          className={(user.level || user.role_name) === role.name ? 'bg-blue-50 text-blue-700' : ''}
                        >
                          <UserCog className="w-3 h-3 mr-2" />
                          Set as {role.name}
                          {(user.level || user.role_name) === role.name && (
                            <Check className="w-3 h-3 ml-auto text-blue-600" />
                          )}
                        </ContextMenuItem>
                      ))}

                      <ContextMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete User
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ))}
  </div>
</TabsContent>

              {/* Authorize Tab */}
              <TabsContent value="authorize" className="p-6 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Role Selection */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-none">
                      <div className="p-3 space-y-2">
                        {/* Add Role Button moved to right of header */}
                        <div className="mb-3 flex justify-between items-center">
                          <div></div>
                          <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                className="text-xs h-8 bg-primary hover:bg-primary/90 text-white rounded-none w-15"
                              >
                                <div className="flex items-right">
                                  <FaUserShield className="w-3 h-3" />
                                </div>
                                <span className="ml-1">Add</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-base">New Role</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
                                  <Input
                                                                    value={newRoleForm.name}
                                onChange={e => setNewRoleForm({...newRoleForm, name: e.target.value})}
                                    className="h-8 text-xs rounded-none"
                                    placeholder="Enter name"
                                  />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-xs h-8 rounded-none"
                                    onClick={() => {
                                      setNewRoleForm({
                                        name: ''
                                      });
                                      setIsAddRoleDialogOpen(false);
                                    }}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    className="text-xs h-8 rounded-none"
                                    onClick={handleCreateRole}
                                    disabled={loading || !newRoleForm.name?.trim()}
                                  >
                                    {loading ? 'Creating...' : 'Add'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {/* Role List */}
                        {userRoles.map((role, index) => (
                          <div key={role.id} className="flex items-center justify-between">
                            <button
                              className={`flex-1 text-left px-2 py-1.5 text-xs rounded-none ${
                                selectedRole === role.name 
                                  ? 'bg-primary text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => setSelectedRole(role.name)}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 w-4 text-center">{index + 1}</span>
                                <FaUserShield className="w-3 h-3" />
                                <span>{role.name}</span>
                              </div>
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteRoleAPI(role.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="lg:col-span-3">
                    <div className="bg-white border border-gray-200 rounded-none">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                        <h3 className="text-xs font-medium text-gray-700">
                          Authorize : <span className="font-semibold">{selectedRole}</span>
                        </h3>
                      </div>
                      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none w-12" onClick={() => handleAuthorizeSort('no')}>
                                <div className="flex items-center justify-center space-x-1">
                                  <span>No.</span>
                                  {authorizeSortField === 'no' && (
                                    authorizeSortDirection === 'asc' ? 
                                      <ChevronUp className="w-3 h-3" /> : 
                                      <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleAuthorizeSort('page')}>
                                <div className="flex items-center space-x-1">
                                  <span>Page</span>
                                  {authorizeSortField === 'page' && (
                                    authorizeSortDirection === 'asc' ? 
                                      <ChevronUp className="w-3 h-3" /> : 
                                      <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleAuthorizeSort('view')}>
                                <div className="flex items-center justify-center space-x-1">
                                  <span>View</span>
                                  {authorizeSortField === 'view' && (
                                    authorizeSortDirection === 'asc' ? 
                                      <ChevronUp className="w-3 h-3" /> : 
                                      <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleAuthorizeSort('edit')}>
                                <div className="flex items-center justify-center space-x-1">
                                  <span>Edit</span>
                                  {authorizeSortField === 'edit' && (
                                    authorizeSortDirection === 'asc' ? 
                                      <ChevronUp className="w-3 h-3" /> : 
                                      <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleAuthorizeSort('report')}>
                                <div className="flex items-center justify-center space-x-1">
                                  <span>Report</span>
                                  {authorizeSortField === 'report' && (
                                    authorizeSortDirection === 'asc' ? 
                                      <ChevronUp className="w-3 h-3" /> : 
                                      <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(() => {
                              let sortedModules = [...modules];
                              
                              if (authorizeSortField) {
                                sortedModules.sort((a, b) => {
                                  let aValue: any, bValue: any;
                                  
                                  switch (authorizeSortField) {
                                    case 'no':
                                      aValue = modules.indexOf(a);
                                      bValue = modules.indexOf(b);
                                      break;
                                    case 'page':
                                      aValue = a.toLowerCase();
                                      bValue = b.toLowerCase();
                                      break;
                                    case 'view':
                                      aValue = rolePermissions[selectedRole]?.[a]?.read ? 1 : 0;
                                      bValue = rolePermissions[selectedRole]?.[b]?.read ? 1 : 0;
                                      break;
                                    case 'edit':
                                      aValue = rolePermissions[selectedRole]?.[a]?.write ? 1 : 0;
                                      bValue = rolePermissions[selectedRole]?.[b]?.write ? 1 : 0;
                                      break;
                                    case 'report':
                                      aValue = rolePermissions[selectedRole]?.[a]?.report ? 1 : 0;
                                      bValue = rolePermissions[selectedRole]?.[b]?.report ? 1 : 0;
                                      break;
                                    default:
                                      return 0;
                                  }
                                  
                                  if (authorizeSortDirection === 'asc') {
                                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                                  } else {
                                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                                  }
                                });
                              }
                              
                              return sortedModules.map((module, index) => (
                                <tr key={module} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 text-center w-12">
                                    <span className="text-xs text-gray-500">{index + 1}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="text-xs text-gray-900">{module}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Checkbox
                                      checked={rolePermissions[selectedRole]?.[module]?.read || false}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRole, module, 'read', checked as boolean)
                                      }
                                      className="rounded-none"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Checkbox
                                      checked={rolePermissions[selectedRole]?.[module]?.write || false}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRole, module, 'write', checked as boolean)
                                      }
                                      disabled={!rolePermissions[selectedRole]?.[module]?.read}
                                      className="rounded-none"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Checkbox
                                      checked={rolePermissions[selectedRole]?.[module]?.report || false}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRole, module, 'report', checked as boolean)
                                      }
                                      disabled={!rolePermissions[selectedRole]?.[module]?.read}
                                      className="rounded-none"
                                    />
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}