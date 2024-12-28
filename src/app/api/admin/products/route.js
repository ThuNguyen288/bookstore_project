import db from "../../dbConect";

// GET method: Lấy danh mục và tags
export async function GET(req) {
  try {
    // Lấy danh mục từ bảng categories
    const [categories] = await db.execute('SELECT * FROM categories');
    
    // Lấy tags từ bảng tags
    const [tags] = await db.execute('SELECT * FROM tags');

    // Lấy all products
    
    const [products] = await db.execute(` 
      SELECT
      p.*,                
      pi.ImageURL AS image 
      FROM products p
    LEFT JOIN productimages pi
    ON p.ProductID = pi.ProductID AND pi.IsPrimary = 1;
      `);

      
    // Trả về sản phẩm, danh mục và tags trong một response
    return new Response(
      JSON.stringify({ categories, tags, products}), 
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching categories or tags:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// POST method: Thêm sản phẩm mới
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      categoryId,
      penType,
      inkColor,
      author,
      publishYear,
      tags,  // tagsId từ yêu cầu
      images,  // Danh sách ảnh từ yêu cầu
    } = body;

    // Kiểm tra dữ liệu bắt buộc
    if (!name || !description || !price || !stock || !categoryId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }
    console.log("Selected Tags:", tags);

    // Thêm sản phẩm vào bảng `products`
    const [product] = await db.execute(
      'INSERT INTO products (Name, Description, Price, Stock, CategoryID) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, categoryId]
    );

    // Thêm chi tiết sách hoặc bút vào bảng tương ứng
    if (categoryId === 1) { // Nếu là sách
      await db.execute(
        'INSERT INTO books (ProductID, Author, PublishYear) VALUES (?, ?, ?)',
        [product.insertId, author, publishYear]
      );
    } else if (categoryId === 2) { // Nếu là bút
      await db.execute(
        'INSERT INTO pens (ProductID, PenType, InkColor) VALUES (?, ?, ?)',
        [product.insertId, penType, inkColor]
      );
    } 

    // Thêm các tag vào bảng `product_tag` (nếu có)
    if (Array.isArray(tags) && tags.length > 0) {
      await Promise.all(
        tags.map(async (tags) => {
          await db.execute(
            'INSERT INTO product_tag (ProductID, TagID) VALUES (?, ?)',
            [product.insertId, tags]
          );
        })
      );
    }

    // API: Thêm ảnh cho sản phẩm (sử dụng Cloudinary)
    if (images && Array.isArray(images) && images.length > 0) {
      await Promise.all(
        images.map(async (image, index) => {
          if (!image) {
            throw new Error('Image URL is required');
          }
          const isPrimary = index === 0 ? 1 : 0;
          await db.execute(
            'INSERT INTO productimages (ProductID, ImageURL, IsPrimary) VALUES (?, ?, ?)',
            [product.insertId, image, isPrimary]
          );
        })
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Error adding product:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
