import Stripe from 'stripe';

// Determine which API key to use based on environment
const getStripeKey = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.STRIPE_SECRET_KEY_LIVE!
    : process.env.STRIPE_SECRET_KEY!;
};

// Initialize Stripe with the appropriate API key based on environment
const stripe = new Stripe(getStripeKey(), {
  apiVersion: '2024-04-10', // Use the latest stable API version
});

export interface CreateProductParams {
  name: string;
  description?: string;
  images?: string[];
  active?: boolean;
  metadata?: Record<string, string>;
}

export interface CreatePriceParams {
  productId: string;
  unitAmount: number;
  currency?: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
  };
  metadata?: Record<string, string>;
}

/**
 * Create a new Stripe product for a course
 */
export async function createProduct(params: CreateProductParams) {
  try {
    const product = await stripe.products.create({
      name: params.name,
      description: params.description,
      images: params.images,
      active: params.active ?? true,
      metadata: params.metadata,
    });
    
    return product;
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw new Error('Failed to create Stripe product');
  }
}

/**
 * Create a new Stripe price for a product
 */
export async function createPrice(params: CreatePriceParams) {
  try {
    const price = await stripe.prices.create({
      product: params.productId,
      unit_amount: params.unitAmount, // In cents (e.g., 1999 = $19.99)
      currency: params.currency || 'usd',
      recurring: params.recurring,
      metadata: params.metadata,
    });
    
    return price;
  } catch (error) {
    console.error('Error creating Stripe price:', error);
    throw new Error('Failed to create Stripe price');
  }
}

/**
 * Create a checkout session for a customer
 */
export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  customerId,
  metadata,
}: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  try {
    // Create checkout parameters
    const params: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    // Add customer if provided
    if (customerId) {
      params.customer = customerId;
    }

    // Create and return the session
    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error('Failed to retrieve subscription');
  }
}

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrRetrieveCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    // Check if customer with this email already exists
    const customers = await stripe.customers.list({ email });
    if (customers.data.length > 0) {
      // Return existing customer
      return customers.data[0];
    }

    // Create new customer
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw new Error('Failed to create or retrieve Stripe customer');
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export default stripe;