// C&V PetShop/frontend/src/Components/UserScreen/Home.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  Modal,
  Animated,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getUser, getToken } from '../../utils/helper';
import UserDrawer from './UserDrawer';
import Header from '../layouts/Header';
import { uiColors } from '../../theme/uiTheme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 180;

const HOME_COLORS = {
  background: '#080c10',
  panel: '#0e1318',
  panelAlt: '#121920',
  accent: '#c9a84c',
  accentStrong: '#a8893a',
  accentSoft: '#f0d080',
  accentGlow: 'rgba(201,168,76,0.15)',
  text: '#f0ebe0',
  mutedText: '#7a7060',
  border: '#1e2830',
  borderGold: 'rgba(201,168,76,0.25)',
  cardShadow: '#000',
  surface: '#0b1016',
};

const CATEGORIES = [
  'All', 'The Caviar Reserve', 'Imperial Crustaceans', 'Grand Cru Finfish', 'Oceanic Treasures', 'The Gold Reserve',
];

const BANNERS = [
  require('../sliding/cray.png'),
  require('../sliding/sea.png'),
  require('../sliding/caviar.png'),
];

// ─── Product Image Carousel ───────────────────────────────────────────────────
const ProductImageCarousel = ({ images, onCardPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const validImages = images && images.length > 0 && images.some(img => img && (img.url || typeof img === 'string'));
  const urls = validImages
    ? images.filter(img => img && (img.url || typeof img === 'string')).map(img => img.url || img)
    : [];

  if (!validImages || urls.length === 0) {
    return (
      <TouchableOpacity onPress={onCardPress} activeOpacity={0.85} style={styles.noImage}>
        <Icon name="set-meal" size={40} color={HOME_COLORS.mutedText} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.imageCarouselContainer}>
      <TouchableOpacity onPress={onCardPress} activeOpacity={0.85} style={{ flex: 1 }}>
        <Image source={{ uri: urls[currentIndex] }} style={styles.productImage} resizeMode="cover" />
      </TouchableOpacity>

      {urls.length > 1 && (
        <>
          <TouchableOpacity
            style={styles.arrowLeft}
            onPress={() => setCurrentIndex(p => (p === 0 ? urls.length - 1 : p - 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowRight}
            onPress={() => setCurrentIndex(p => (p === urls.length - 1 ? 0 : p + 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
          <View style={styles.imageIndicatorContainer} pointerEvents="none">
            {urls.map((_, i) => (
              <View key={i} style={[styles.imageIndicatorDot, i === currentIndex && styles.imageIndicatorDotActive]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

// ─── Star Rating Component ───────────────────────────────────────────────────
const StarRating = ({ rating, size = 12, showRating = false }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={styles.starRatingContainer}>
      <View style={styles.starsRow}>
        {[...Array(fullStars)].map((_, i) => (
          <Icon key={`full-${i}`} name="star" size={size} color={HOME_COLORS.accent} />
        ))}
        {halfStar && <Icon name="star-half" size={size} color={HOME_COLORS.accent} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Icon key={`empty-${i}`} name="star-border" size={size} color={HOME_COLORS.mutedText} />
        ))}
      </View>
      {showRating && <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>}
    </View>
  );
};

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, opacity }) => (
  <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
    <Text style={styles.toastText}>{message}</Text>
  </Animated.View>
);

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [user,             setUser]             = useState(null);
  const [products,         setProducts]         = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortAscending,    setSortAscending]    = useState(false);
  const [showCategories,   setShowCategories]   = useState(false);
  const [cart,             setCart]             = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [toastMessage,     setToastMessage]     = useState('');

  // Review states
  const [productReviews, setProductReviews] = useState({});
  const [loadingReviews, setLoadingReviews] = useState({});

  const flatListRef    = useRef(null);
  const autoSlideTimer = useRef(null);
  const toastOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, searchQuery, sortAscending]);

  useEffect(() => {
    if (BANNERS.length > 1) startAutoSlide();
    return () => stopAutoSlide();
  }, [currentBannerIndex]);

  // Fetch reviews for all products when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      fetchAllProductReviews();
    }
  }, [products]);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideTimer.current = setInterval(() => {
      const next = (currentBannerIndex + 1) % BANNERS.length;
      flatListRef.current?.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
      setCurrentBannerIndex(next);
    }, 3000);
  };

  const stopAutoSlide = () => {
    if (autoSlideTimer.current) { clearInterval(autoSlideTimer.current); autoSlideTimer.current = null; }
  };

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== currentBannerIndex) setCurrentBannerIndex(idx);
  };

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const loadInitialData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
      const token = await getToken();
      if (!token) { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
      await Promise.all([fetchProducts(), fetchCart()]);
    } catch (e) {
      console.error('Error loading initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    await fetchAllProductReviews();
    setRefreshing(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v1/products`);
      if (res.data?.success) {
        setProducts(res.data.products || []);
        setFilteredProducts(res.data.products || []);
      }
    } catch (e) { console.error('Error fetching products:', e.message); }
  };

  const fetchCart = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BACKEND_URL}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.cart) setCart(res.data.cart.items || []);
    } catch (e) { console.error('Error fetching cart:', e); }
  };

  // ── Fetch reviews for all products ────────────────────────────────────────
  const fetchAllProductReviews = async () => {
    if (!products || products.length === 0) return;

    const reviewPromises = products.map(product =>
      fetchProductReviews(product._id)
    );

    await Promise.all(reviewPromises);
  };

  const fetchProductReviews = async (productId) => {
    try {
      setLoadingReviews(prev => ({ ...prev, [productId]: true }));

      const response = await axios.get(`${BACKEND_URL}/api/v1/reviews?productId=${productId}`);

      if (response.data.success) {
        setProductReviews(prev => ({
          ...prev,
          [productId]: response.data.reviews || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      setProductReviews(prev => ({ ...prev, [productId]: [] }));
    } finally {
      setLoadingReviews(prev => ({ ...prev, [productId]: false }));
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    if (selectedCategory !== 'All') filtered = filtered.filter(p => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    // Sort products - if sorting by price, use the actual selling price (discounted if on sale)
    filtered.sort((a, b) => {
      const priceA = a.isOnSale && a.discountedPrice ? parseFloat(a.discountedPrice) : parseFloat(a.price || 0);
      const priceB = b.isOnSale && b.discountedPrice ? parseFloat(b.discountedPrice) : parseFloat(b.price || 0);
      return sortAscending ? priceA - priceB : priceB - priceA;
    });

    setFilteredProducts(filtered);
  };

  // ── Calculate average rating for a product ───────────────────────────────
  const getProductAverageRating = (productId) => {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return sum / reviews.length;
  };

  // ── POST /api/v1/cart/add — shows toast, updates local cart badge ─────────
  const handleAddToCart = async (product) => {
    try {
      const token = await getToken();
      if (!token) { navigation.navigate('Login'); return; }

      const res = await axios.post(
        `${BACKEND_URL}/api/v1/cart/add`,
        { productId: product._id },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setCart(res.data.cart.items || []);
        showToast(`✅ "${product.name}" added to cart!`);
      }
    } catch (e) {
      console.error('Error adding to cart:', e);
      showToast(`❌ ${e.response?.data?.message || e.message}`);
    }
  };

  // Updated Buy Now to go directly to Checkout
  const handleBuyNow = (product) => {
    navigation.navigate('Checkout', {
      productId: product._id,
      quantity: 1,
      product: {
        ...product,
        effectivePrice: product.isOnSale && product.discountedPrice ? product.discountedPrice : product.price
      },
    });
  };

  const handleProductPress = (product) => navigation.navigate('SingleProduct', { productId: product._id });
  const toggleSort         = () => setSortAscending(p => !p);
  const selectCategory     = (cat) => { setSelectedCategory(cat); setShowCategories(false); };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderBannerItem = ({ item }) => (
    <View style={styles.bannerContainer}>
      <Image source={item} style={styles.bannerImage} />
      {/* Luxury gradient overlay on banners */}
      <View style={styles.bannerOverlay} />
    </View>
  );

  const renderProductItem = ({ item }) => {
    const displayPrice = item.isOnSale && item.discountedPrice
      ? parseFloat(item.discountedPrice).toFixed(2)
      : parseFloat(item.price || 0).toFixed(2);

    const originalPrice = item.isOnSale && item.discountedPrice
      ? parseFloat(item.price).toFixed(2)
      : null;

    const averageRating = getProductAverageRating(item._id);
    const reviewCount = (productReviews[item._id] || []).length;
    const isLoadingReview = loadingReviews[item._id];

    return (
      <View style={styles.productCard}>
        {/* Gold top accent line */}
        <View style={styles.cardTopAccent} />

        <View style={styles.imageContainer}>
          <ProductImageCarousel images={item.images} onCardPress={() => handleProductPress(item)} />
          {item.isOnSale && item.discountedPrice && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>SALE</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => handleProductPress(item)} activeOpacity={0.85}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productCategory} numberOfLines={1}>{item.category || 'Uncategorized'}</Text>

            {/* Rating Display */}
            {!isLoadingReview && reviewCount > 0 ? (
              <View style={styles.reviewSummaryContainer}>
                <StarRating rating={averageRating} size={12} showRating={true} />
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              </View>
            ) : isLoadingReview ? (
              <ActivityIndicator size="small" color={HOME_COLORS.accent} style={styles.reviewLoader} />
            ) : null}

            {/* Price */}
            <View style={styles.priceContainer}>
              {item.isOnSale && item.discountedPrice ? (
                <>
                  <Text style={styles.originalPrice}>₱{originalPrice}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      {item.discountPercentage ? `${item.discountPercentage}% OFF` : 'SALE'}
                    </Text>
                  </View>
                  <Text style={styles.discountedPrice}>₱{displayPrice}</Text>
                </>
              ) : (
                <Text style={styles.productPrice}>₱{displayPrice}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.cardDivider} />

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cartButton} onPress={() => handleAddToCart(item)}>
            <Icon name="add-shopping-cart" size={18} color={HOME_COLORS.accent} />
            <Text style={styles.cartButtonText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={() => handleBuyNow(item)}>
            <Icon name="shopping-cart-checkout" size={18} color={HOME_COLORS.background} />
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item && styles.selectedCategoryItem]}
      onPress={() => selectCategory(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryItemText, selectedCategory === item && styles.selectedCategoryItemText]}>
        {item}
      </Text>
      {selectedCategory === item && <Icon name="check" size={16} color={HOME_COLORS.accent} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HOME_COLORS.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <UserDrawer>
      <View style={styles.container}>
        <Header />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HOME_COLORS.accent} />}
        >
          {/* ── Search Bar ── */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={HOME_COLORS.accent} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for pet products..."
              placeholderTextColor={HOME_COLORS.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={HOME_COLORS.mutedText} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Banner Slider ── */}
          <View style={styles.bannerWrapper}>
            <FlatList
              ref={flatListRef}
              data={BANNERS}
              renderItem={renderBannerItem}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onScrollBeginDrag={stopAutoSlide}
              onScrollEndDrag={startAutoSlide}
            />
            {/* Gold indicator dots */}
            <View style={styles.indicatorContainer}>
              {BANNERS.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    flatListRef.current?.scrollToOffset({ offset: idx * SCREEN_WIDTH, animated: true });
                    setCurrentBannerIndex(idx);
                  }}
                >
                  <View style={[styles.indicator, currentBannerIndex === idx && styles.activeIndicator]} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Bottom gold rule on banner */}
            <View style={styles.bannerBottomRule} />
          </View>

          {/* ── Filter Row ── */}
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategories(true)} activeOpacity={0.7}>
              <Icon name="category" size={18} color={HOME_COLORS.accent} />
              <Text style={styles.categorySelectorText} numberOfLines={1}>{selectedCategory}</Text>
              <Icon name="arrow-drop-down" size={22} color={HOME_COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.priceFilterButton} onPress={toggleSort}>
              <Icon name="attach-money" size={18} color={HOME_COLORS.accent} />
              <Text style={styles.priceFilterText} numberOfLines={1}>Price {sortAscending ? '↑' : '↓'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Section Header ── */}
          <View style={styles.productsHeader}>
            <View style={styles.productsTitleRow}>
              <View style={styles.titleAccentBar} />
              <Text style={styles.productsTitle}>Featured Products</Text>
            </View>
            <Text style={styles.productCount}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map(item => (
                <View key={item._id} style={styles.gridItem}>
                  {renderProductItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={60} color={HOME_COLORS.mutedText} />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>Try different search or category</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        <Toast message={toastMessage} opacity={toastOpacity} />

        {/* ── Category Modal ── */}
        <Modal visible={showCategories} transparent animationType="fade" onRequestClose={() => setShowCategories(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategories(false)}>
            <View style={styles.categoriesDropdown}>
              <View style={styles.categoriesHeader}>
                <View style={styles.titleAccentBar} />
                <Text style={styles.categoriesTitle}>Select Category</Text>
              </View>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(_, i) => i.toString()}
                style={styles.categoriesList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </UserDrawer>
  );
}

const styles = StyleSheet.create({
  // ── Base ──────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: HOME_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HOME_COLORS.background,
  },
  loadingText: {
    color: HOME_COLORS.mutedText,
    marginTop: 12,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollView: { flex: 1 },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(14,19,24,0.97)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    shadowColor: HOME_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  toastText: {
    color: HOME_COLORS.accentSoft,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ── Search Bar ────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HOME_COLORS.panelAlt,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    elevation: 4,
    shadowColor: HOME_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: HOME_COLORS.text,
    letterSpacing: 0.3,
  },

  // ── Banner ────────────────────────────────────────────────────────────────
  bannerWrapper: {
    height: BANNER_HEIGHT,
    marginBottom: 0,
    position: 'relative',
  },
  bannerContainer: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,16,0.38)',
  },
  bannerBottomRule: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: HOME_COLORS.accent,
    opacity: 0.5,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(201,168,76,0.35)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: HOME_COLORS.accent,
    width: 32,
    height: 2,
  },

  // ── Filter Row ────────────────────────────────────────────────────────────
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: HOME_COLORS.border,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HOME_COLORS.panelAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    flex: 0.48,
  },
  categorySelectorText: {
    fontSize: 13,
    color: HOME_COLORS.text,
    marginHorizontal: 8,
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  priceFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HOME_COLORS.panelAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    flex: 0.48,
  },
  priceFilterText: {
    fontSize: 13,
    color: HOME_COLORS.text,
    marginLeft: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Products Header ───────────────────────────────────────────────────────
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  productsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleAccentBar: {
    width: 3,
    height: 18,
    backgroundColor: HOME_COLORS.accent,
    borderRadius: 2,
    marginRight: 10,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_COLORS.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  productCount: {
    fontSize: 12,
    color: HOME_COLORS.mutedText,
    letterSpacing: 0.5,
  },

  // ── Product Grid ──────────────────────────────────────────────────────────
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 4,
  },

  // ── Product Card ──────────────────────────────────────────────────────────
  productCard: {
    backgroundColor: HOME_COLORS.panel,
    borderRadius: 6,
    marginBottom: 14,
    elevation: 6,
    shadowColor: HOME_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
  },
  cardTopAccent: {
    height: 1.5,
    backgroundColor: HOME_COLORS.accent,
    opacity: 0.6,
  },
  imageContainer: {
    height: 130,
    backgroundColor: HOME_COLORS.panelAlt,
    position: 'relative',
  },
  imageCarouselContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HOME_COLORS.panelAlt,
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: HOME_COLORS.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    zIndex: 10,
  },
  saleBadgeText: {
    color: HOME_COLORS.background,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arrowLeft: {
    position: 'absolute',
    left: 4,
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: 'rgba(8,12,16,0.65)',
    borderRadius: 14,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
  },
  arrowRight: {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: 'rgba(8,12,16,0.65)',
    borderRadius: 14,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
  },
  arrowText: {
    color: HOME_COLORS.accentSoft,
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageIndicatorDot: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(201,168,76,0.3)',
    marginHorizontal: 2,
  },
  imageIndicatorDotActive: {
    backgroundColor: HOME_COLORS.accent,
    width: 20,
  },

  // ── Product Info ──────────────────────────────────────────────────────────
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: HOME_COLORS.text,
    marginBottom: 3,
    height: 38,
    letterSpacing: 0.2,
  },
  productCategory: {
    fontSize: 11,
    color: HOME_COLORS.accent,
    marginBottom: 5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_COLORS.accentSoft,
    letterSpacing: 0.5,
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviewSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  starRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: HOME_COLORS.mutedText,
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 10,
    color: HOME_COLORS.mutedText,
    marginLeft: 2,
  },
  reviewLoader: {
    marginBottom: 5,
    alignSelf: 'flex-start',
  },

  // ── Price / Discount ──────────────────────────────────────────────────────
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  originalPrice: {
    fontSize: 11,
    color: HOME_COLORS.mutedText,
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_COLORS.accentSoft,
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 5,
  },
  discountBadgeText: {
    color: HOME_COLORS.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Action Buttons ────────────────────────────────────────────────────────
  cardDivider: {
    height: 1,
    backgroundColor: HOME_COLORS.border,
    marginHorizontal: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 3,
    marginRight: 5,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
  },
  cartButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: HOME_COLORS.accent,
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HOME_COLORS.accent,
    paddingVertical: 8,
    borderRadius: 3,
    marginLeft: 5,
  },
  buyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: HOME_COLORS.background,
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_COLORS.text,
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  emptySubtext: {
    fontSize: 13,
    color: HOME_COLORS.mutedText,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Category Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  categoriesDropdown: {
    backgroundColor: HOME_COLORS.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: HOME_COLORS.borderGold,
    marginHorizontal: 20,
    maxHeight: 400,
    elevation: 10,
    shadowColor: HOME_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: HOME_COLORS.border,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: HOME_COLORS.text,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  categoriesList: { maxHeight: 350 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: HOME_COLORS.border,
  },
  selectedCategoryItem: {
    backgroundColor: HOME_COLORS.accentGlow,
  },
  categoryItemText: {
    fontSize: 14,
    color: HOME_COLORS.mutedText,
    letterSpacing: 0.3,
  },
  selectedCategoryItemText: {
    color: HOME_COLORS.accentSoft,
    fontWeight: '600',
  },
});