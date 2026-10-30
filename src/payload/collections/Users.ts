import type { Access, CollectionConfig, FieldAccess } from 'payload'

const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'
const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: true,
  access: {
    // Only admins manage the user list; everyone authenticated can read.
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => Boolean(user),
    // Admins update anyone; a manager may update only their own record.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'manager',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Manager', value: 'manager' },
      ],
      access: {
        // Only admins may grant or change roles.
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
}
