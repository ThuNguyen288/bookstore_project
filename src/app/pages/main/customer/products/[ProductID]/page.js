'use client';
import HotProducts from '@/app/components/HotProducts';
import RelatedItems from '@/app/components/RelatedItems';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const ProductDetail = ({ params }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');
  const [roleID, setRoleID] = useState(null); // State to store the roleID
  const [canEdit, setCanEdit] = useState(false); // State to check if the user is allowed to edit
  const [editingField, setEditingField] = useState(null); // Track the field being edited
  const [updatedProduct, setUpdatedProduct] = useState({}); // To store updated product data

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { ProductID } = await params;

        // Lấy roleID và CustomerID từ localStorage
        const roleID = localStorage.getItem("roleId");
        const CustomerID = localStorage.getItem("customerId");
        console.log(roleID);
        // Fetch chi tiết sản phẩm
        const res = await fetch(`/api/${ProductID}`);
        if (!res.ok) throw new Error("Failed to fetch product details");

        const data = await res.json();
        if (!data.product) throw new Error("Product not found");

        setProduct(data.product);

        // Nếu là customer (roleID = 1), thì mới gọi tăng click và điểm
        if (roleID === '1') {
          await fetch(`/api/${ProductID}?CustomerID=${CustomerID}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ increment: 0.5 }),
          });
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRoleID = localStorage.getItem('roleId');
      if (storedRoleID) {
        setRoleID(storedRoleID);
        if (storedRoleID === '2') {
          setCanEdit(true); // Allow edit if roleID is 2
        }
      }
    }
  }, []); // Empty dependency array to run only once

  const handleDoubleClick = (field) => {
    if (canEdit) {
      setEditingField(field); // Track the field being edited
      setUpdatedProduct({ ...product }); // Initialize updated product data with current values
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = async () => {
    try {
      const res = await fetch(`/api/${product.ProductID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) throw new Error("Failed to update product");
      setProduct(updatedProduct); // Update the product state with new data
      setEditingField(null); // Close the edit mode
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddToCart = async () => {
    try {
      const CustomerID = localStorage.getItem('customerId');
      if (!CustomerID) throw new Error('Customer ID is missing. Please login again.');

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CustomerID,
          ProductID: product.ProductID,
          Quantity: quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to add product to cart');

      setNotification('Product added to cart successfully!');
    } catch (err) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 1 && value <= product.Stock) {
      setQuantity(value);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-2 gap-8">
      <h1 className="font-semibold cursor-pointer" onDoubleClick={() => handleDoubleClick('Name')}>
            {editingField === 'Name' ? (
              <input
                type="text"
                name="Name"
                value={updatedProduct.Name || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                autoFocus
                className="w-full border-none p-2"
              />
            ) : (
              product.Name
            )}
          </h1>
        <div></div>
        <div className="border border-gray-500 w-full h-full flex items-center justify-center">
          <img
            src={product.image || 'https://via.placeholder.com/500'}
            alt={product.Name}
            className="h-80 object-contain mx-auto"
          />
        </div>
        <div>
          <div className="mt-4">
            {product.CategoryID == 1 ? (
              <div>
                <p><strong>Author:</strong> {product.Author}</p>
                <p><strong>PublishYear:</strong> {product.PublishYear}</p>
              </div>
            ) : product.CategoryID == 2 ? (
              <div>
                <p><strong>Pentype:</strong> {product.PenType}</p>
                <p><strong>InkColor:</strong> {product.InkColor}</p>
              </div>
            ) : (
              <p><strong>Other Information:</strong>None</p>
            )}
          </div>

          {/* Editable Description and Name */}
          <p
            className="mt-4 cursor-pointer"
            onDoubleClick={() => handleDoubleClick('Description')}
          >
            {editingField === 'Description' ? (
              <textarea
                name="Description"
                value={updatedProduct.Description || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                autoFocus
                className="w-full border p-2"
              />
            ) : (
              product.Description
            )}
          </p>

          <p className="mt-12 text-xl font-semibold text-right">{product.Price} VND</p>
          {product.Stock > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <label htmlFor="quantity" className="mr-2">
                  Quantity:
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  min="1"
                  max={product.Stock}
                  onChange={handleQuantityChange}
                  className="border p-2 rounded"
                />
              </div>

              <button
                onClick={handleAddToCart}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <p className="text-red-500">Out of stock</p>
          )}
        </div>

        {product.Tags && product.Tags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-base font-medium">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {product.Tags.map((tag, index) => (
                <Link
                  href={`/pages/main/customer/search?attribute=${tag}`}
                  key={index}
                  className="px-3 py-1 no-underline text-black bg-gray-200 rounded-full text-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg">
          {notification}
        </div>
      )}

      <hr className="my-10" />
      {product && <RelatedItems currentProduct={product} />}
      <hr className="my-10" />
      <HotProducts />
    </div>
  );
};

export default ProductDetail;
