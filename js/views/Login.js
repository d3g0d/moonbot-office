import FloatingLabelInput from '../components/FloatingLabelInput.js';
import { fetchApi } from '../utils/api.js?v=5';

export default {
    name: 'Login',
    components: {
        FloatingLabelInput
    },
    mounted() {
        // Clear all storage when arriving at the login page
        localStorage.clear();
        sessionStorage.clear();
    },
    data() {
        return {
            form: {
                username:'', //'superadmin',
                password:'', //'babibubebo11'
            },
            loading: false,
            error: null
        }
    },
    template: `
        <div class="min-h-screen bg-login flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                <div class="flex justify-center items-center gap-2 text-white">
                    <img src="./assets/images/logo/logo.svg" class="h-12 w-auto" alt="Moonbot">
                </div>
            </div>
 
            <div class="sm:mx-auto sm:w-full sm:max-w-md px-4">
                <!-- Transparent Card -->
                <div class="py-8 px-6 rounded-lg shadow-xl relative backdrop-blur-sm bg-white/5">
                    
                    <form class="space-y-6" @submit.prevent="handleLogin">
                        <!-- Error Message -->
                        <div v-if="error" class="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
                            {{ error }}
                        </div>

                        <!-- Username Field -->
                        <FloatingLabelInput 
                            id="username" 
                            label="Username" 
                            v-model="form.username" 
                        />

                        <!-- Password Field -->
                        <FloatingLabelInput 
                            id="password" 
                            type="password" 
                            label="Password" 
                            v-model="form.password" 
                        />

                        <!-- Login Button -->
                        <div class="pt-2">
                            <button type="submit" 
                                :disabled="loading"
                                class="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-sm font-bold text-white bg-[#00DAB8] hover:bg-[#1ABC9C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC9C] transition duration-150 ease-in-out uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                                <span v-if="loading">Logging in...</span>
                                <span v-else>Login</span>
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    `,
    methods: {
        async handleLogin() {
            this.loading = true;
            this.error = null;
            
            try {
                console.log('Login attempt with:', this.form);
                const response = await fetchApi('/login', {
                    method: 'POST',
                    body: this.form
                });

                console.log('Login successful, received temp_token:', response);
                
                // Store temp_token for OTP verification
                const tempToken = response.data?.temp_token;
                if (tempToken) {
                    sessionStorage.setItem('moon_office_temp_token', tempToken);
                    localStorage.setItem('moon_office_username', this.form.username);
                }

                console.log('Redirecting to OTP Verification with temp_token...');
                
                // Redirect to OTP Verification
                this.$router.push('/otp');
            } catch (err) {
                this.error = err.message || 'Login failed. Please check your credentials.';
            } finally {
                this.loading = false;
            }
        }
    }
}
