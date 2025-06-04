'use client';
import { useState, useEffect } from 'react';

export default function ServiceForm({ service, onSave, onCancel, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('basic_wash'); // Default category
  const [formError, setFormError] = useState('');

  const serviceCategories = ['basic_wash', 'premium_wash', 'detailing_services', 'additional_services', 'package_deals'];

  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setDescription(service.description || '');
      setPrice(service.price !== undefined ? String(service.price) : '');
      setCategory(service.category || 'basic_wash');
    } else {
      // Reset form for new service
      setName('');
      setDescription('');
      setPrice('');
      setCategory('basic_wash');
    }
    setFormError(''); // Clear error when service/mode changes
  }, [service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !price.trim() || !category.trim()) {
      setFormError('Name, price, and category are required.');
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      price: priceValue,
      category,
    });
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3>{service ? 'Edit Service' : 'Create New Service'}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="serviceName">Name:</label>
          <input
            id="serviceName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="serviceDescription">Description:</label>
          <textarea
            id="serviceDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="servicePrice">Price:</label>
          <input
            id="servicePrice"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="serviceCategory">Category:</label>
          <select
            id="serviceCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            {serviceCategories.map(cat => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '10px 15px' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
            {loading ? 'Saving...' : (service ? 'Save Changes' : 'Create Service')}
          </button>
        </div>
      </form>
    </div>
  );
}
