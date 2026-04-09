import { useEffect, useState } from 'react'
import { restaurantOwnerAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const emptyRestaurantForm = {
  name: '',
  description: '',
  cuisine: '',
  location: 'Nyeri Town',
  address: '',
  phone: '',
  image: '',
  delivery_time: 30,
  minimum_order: 200,
  is_open: true,
}

const emptyMenuForm = {
  name: '',
  description: '',
  price: '',
  category: 'Main',
  image: '',
  is_unavailable: false,
}

export default function RestaurantManagePage() {
  const { toast } = useToast()
  const [restaurant, setRestaurant] = useState(null)
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurantForm)
  const [menuForm, setMenuForm] = useState(emptyMenuForm)
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingRestaurant, setSavingRestaurant] = useState(false)
  const [savingMenu, setSavingMenu] = useState(false)
  const [deletingMenuId, setDeletingMenuId] = useState(null)

  useEffect(() => {
    restaurantOwnerAPI.myRestaurant()
      .then(({ data }) => {
        setRestaurant(data)
        setRestaurantForm({
          name: data.name || '',
          description: data.description || '',
          cuisine: data.cuisine || '',
          location: data.location || 'Nyeri Town',
          address: data.address || '',
          phone: data.phone || '',
          image: data.image || '',
          delivery_time: data.delivery_time || 30,
          minimum_order: data.minimum_order || 200,
          is_open: data.is_open ?? true,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const syncRestaurant = (data) => {
    setRestaurant(data)
    setRestaurantForm({
      name: data.name || '',
      description: data.description || '',
      cuisine: data.cuisine || '',
      location: data.location || 'Nyeri Town',
      address: data.address || '',
      phone: data.phone || '',
      image: data.image || '',
      delivery_time: data.delivery_time || 30,
      minimum_order: data.minimum_order || 200,
      is_open: data.is_open ?? true,
    })
  }

  const saveRestaurant = async (event) => {
    event.preventDefault()
    setSavingRestaurant(true)
    try {
      const payload = {
        ...restaurantForm,
        image: restaurantForm.image || null,
        delivery_time: Number(restaurantForm.delivery_time) || 30,
        minimum_order: Number(restaurantForm.minimum_order) || 0,
      }
      const response = restaurant
        ? await restaurantOwnerAPI.updateRestaurant(payload)
        : await restaurantOwnerAPI.createRestaurant(payload)
      syncRestaurant(response.data)
      toast.success('Restaurant saved', 'Your restaurant profile is now live.')
    } catch (error) {
      toast.error('Save failed', error.response?.data?.detail || 'Please check the form and try again.')
    } finally {
      setSavingRestaurant(false)
    }
  }

  const startEditingMenu = (item) => {
    setEditingMenuId(item.id)
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || 'Main',
      image: item.image || '',
      is_unavailable: !!item.is_unavailable,
    })
  }

  const resetMenuForm = () => {
    setEditingMenuId(null)
    setMenuForm(emptyMenuForm)
  }

  const saveMenuItem = async (event) => {
    event.preventDefault()
    if (!restaurant) {
      toast.error('Create restaurant first', 'Save the restaurant profile before adding menu items.')
      return
    }

    setSavingMenu(true)
    try {
      const payload = {
        ...menuForm,
        price: Number(menuForm.price),
        image: menuForm.image || null,
      }
      const response = editingMenuId
        ? await restaurantOwnerAPI.updateMenuItem(editingMenuId, payload)
        : await restaurantOwnerAPI.createMenuItem(payload)

      const savedItem = response.data
      const nextMenu = editingMenuId
        ? (restaurant.menu || []).map((item) => item.id === editingMenuId ? savedItem : item)
        : [...(restaurant.menu || []), savedItem]

      setRestaurant((current) => ({ ...current, menu: nextMenu, menu_count: nextMenu.length }))
      resetMenuForm()
      toast.success('Menu updated', editingMenuId ? 'Menu item changed successfully.' : 'Menu item added successfully.')
    } catch (error) {
      toast.error('Menu save failed', error.response?.data?.detail || 'Please review the item details and try again.')
    } finally {
      setSavingMenu(false)
    }
  }

  const handleDeleteMenu = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return
    setDeletingMenuId(itemId)
    try {
      await restaurantOwnerAPI.deleteMenuItem(itemId)
      const nextMenu = (restaurant.menu || []).filter((item) => item.id !== itemId)
      setRestaurant((current) => ({ ...current, menu: nextMenu, menu_count: nextMenu.length }))
      if (editingMenuId === itemId) resetMenuForm()
      toast.success('Menu item deleted', 'The item has been removed from your restaurant.')
    } catch (error) {
      toast.error('Delete failed', error.response?.data?.detail || 'Could not remove the menu item.')
    } finally {
      setDeletingMenuId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Manage Restaurant</h1>
        <p className="text-slate-500 mt-1 text-sm">Set up your restaurant profile and keep your menu updated for customers.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form onSubmit={saveRestaurant} className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-800">Restaurant Details</h2>
            {restaurant && (
              <span className={`badge ${restaurantForm.is_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {restaurantForm.is_open ? 'Open to orders' : 'Closed'}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Restaurant name" value={restaurantForm.name} onChange={(event) => setRestaurantForm((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Phone number" value={restaurantForm.phone} onChange={(event) => setRestaurantForm((current) => ({ ...current, phone: event.target.value }))} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Cuisine" value={restaurantForm.cuisine} onChange={(event) => setRestaurantForm((current) => ({ ...current, cuisine: event.target.value }))} />
            <Input label="Location" value={restaurantForm.location} onChange={(event) => setRestaurantForm((current) => ({ ...current, location: event.target.value }))} />
          </div>

          <Input label="Address" value={restaurantForm.address} onChange={(event) => setRestaurantForm((current) => ({ ...current, address: event.target.value }))} />
          <Input label="Image URL" value={restaurantForm.image} onChange={(event) => setRestaurantForm((current) => ({ ...current, image: event.target.value }))} hint="Optional for now. Paste a hosted image link." />

          <div>
            <label className="label-base">Description</label>
            <textarea
              rows={4}
              value={restaurantForm.description}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, description: event.target.value }))}
              className="input-base resize-none"
              placeholder="Tell customers what makes your restaurant special."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Delivery time (minutes)"
              type="number"
              min="5"
              value={restaurantForm.delivery_time}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, delivery_time: event.target.value }))}
            />
            <Input
              label="Minimum order (KSh)"
              type="number"
              min="0"
              value={restaurantForm.minimum_order}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, minimum_order: event.target.value }))}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={restaurantForm.is_open}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, is_open: event.target.checked }))}
              className="accent-primary-600"
            />
            <span className="text-sm text-slate-700">Accept orders right now</span>
          </label>

          <Button type="submit" loading={savingRestaurant}>
            {restaurant ? 'Save Restaurant Changes' : 'Create Restaurant'}
          </Button>
        </form>

        <div className="space-y-5">
          <form onSubmit={saveMenuItem} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-slate-800">{editingMenuId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              {editingMenuId && (
                <button type="button" onClick={resetMenuForm} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Cancel
                </button>
              )}
            </div>

            <Input label="Item name" value={menuForm.name} onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))} />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Price (KSh)" type="number" min="0" value={menuForm.price} onChange={(event) => setMenuForm((current) => ({ ...current, price: event.target.value }))} />
              <Input label="Category" value={menuForm.category} onChange={(event) => setMenuForm((current) => ({ ...current, category: event.target.value }))} />
            </div>

            <Input label="Image URL" value={menuForm.image} onChange={(event) => setMenuForm((current) => ({ ...current, image: event.target.value }))} />

            <div>
              <label className="label-base">Description</label>
              <textarea
                rows={3}
                value={menuForm.description}
                onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                className="input-base resize-none"
                placeholder="Short description for the item."
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={menuForm.is_unavailable}
                onChange={(event) => setMenuForm((current) => ({ ...current, is_unavailable: event.target.checked }))}
                className="accent-primary-600"
              />
              <span className="text-sm text-slate-700">Mark as unavailable</span>
            </label>

            <Button type="submit" loading={savingMenu}>
              {editingMenuId ? 'Save Menu Item' : 'Add To Menu'}
            </Button>
          </form>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-display font-semibold text-slate-800">Current Menu</h2>
              <span className="badge bg-slate-100 text-slate-700">{restaurant?.menu?.length || 0} items</span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-5 py-6"><div className="skeleton h-20 w-full rounded-xl" /></div>
              ) : !restaurant ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  Save the restaurant profile first, then your menu will live here.
                </div>
              ) : (restaurant.menu || []).length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No menu items yet. Add your first dish on the left.
                </div>
              ) : (restaurant.menu || []).map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <span className="badge bg-slate-100 text-slate-700">{item.category}</span>
                      {item.is_unavailable && <span className="badge bg-amber-100 text-amber-700">Unavailable</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{item.description || 'No description yet.'}</p>
                    <p className="text-sm font-semibold text-primary-600 mt-2">KSh {Number(item.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => startEditingMenu(item)} className="btn-secondary text-sm py-2 px-3">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenu(item.id)}
                      disabled={deletingMenuId === item.id}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm px-3 py-2 rounded-xl disabled:opacity-50"
                    >
                      {deletingMenuId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
