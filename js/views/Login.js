import FloatingLabelInput from '../components/FloatingLabelInput.js';
import { fetchApi } from '../utils/api.js?v=4';

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
