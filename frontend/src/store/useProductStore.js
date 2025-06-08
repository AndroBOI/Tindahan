import {create} from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : ""

export const useProductStore = create((set,get) => ({
    products: [],
    loading: false,
    error:null,
    currentProduct: null,


    formData: {
        name:"",
        price:"",
        image:"",
    },

    setFormData: (formData) => set({formData}),
    resetForm: () => set({formData: {name: "", price: "", image: ""}}),
    addProduct: async (e) => {
        e.preventDefault();
        set({loading: true})

        try {
            const {formData, products} = get()

            const isDuplicate = products.some((p) => {
                return (
                    p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
                    parseFloat(p.price) === parseFloat(formData.price) &&
                    p.image.trim() === formData.image.trim()
                )
            })

            if(isDuplicate) {
                toast.error("Product already exists")
                return
            }

            await axios.post(`${BASE_URL}/api/products`, formData)
            await get().fetchProducts()
            get().resetForm()
            toast.success("Product added successfully")
            document.getElementById("add_product_modal").close()
        } catch (err) {
            console.log("Error in addProduct function", err)
            toast.error("Sum ting wong")
        } finally {
            set({loading: false})
        }
    },

    fetchProducts: async () => {
        set({loading:true});
        try {
            const response = await axios.get(`${BASE_URL}/api/products`)
            set({products:response.data.data, error: null})
        } catch (error) {
            if(error.status == 429) set({error: "Rate limit exceeded", products: []})
            else set({error: "something went wrong", products: []})
        } finally {
            set({loading:false})
        }
    },

    deleteProduct: async (id) => {
        set({loading: true})
        try {
            await axios.delete(`${BASE_URL}/api/products/${id}`)
            set(prev => ({products: prev.products.filter(product => product.id !== id)}))
            toast.success("Product deleted successfully")
        } catch(err) {
            console.log("Error in deleteProduct Function", err)
            toast.error("Something Went Wrong")
        } finally {
            set({loading: false})
        }
    },

    fetchProduct: async (id) => {
        set({loading: true}) 
        try {
            const response =  await axios.get(`${BASE_URL}/api/products/${id}`)
            set({currentProduct: response.data.data,
                formData: response.data.data,
                error: null, 
            })
        } catch (err) {
            console.log('Error in fetcProduct function', err)
            set({error: "Something went wrong", currentProduct: null})
          
        } finally {
              set({loading: false})
        }
    },
    updateProduct: async (id) => {
        set({loading: true})
        try {
            const {formData} = get()
            const response =  await axios.put(`${BASE_URL}/api/products/${id}`, formData)
            set({currentProduct: response.data.data})
            toast.success("Product updated successfully")
        } catch (err) {
            toast.error("something went wrong")
            console.log("error in updateProduct", err)
            
        } finally {
              set({loading: false})
        }
    }
    
    


}))