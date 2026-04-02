import { fetchApi } from '../utils/api.js?v=4';

export default {
    name: 'OTPVerification',
    data() {
        return {
            otp: ['', '', '', '', '', ''],
            timeLeft: 0,
            timer: null,
            resendCount: 0,
            resendIntervals: [0, 30, 60, 300],
            errorMsg: null,
            submitting: false,
            tempToken: sessionStorage.getItem('moon_office_temp_token')
        }
    },
    mounted() {
        if (!this.tempToken) {
            this.$router.push('/login');
            return;
        }
        this.startTimer(this.resendIntervals[0]);
        // focus first input
        this.$nextTick(() => {
            const firstInput = this.$refs.otpInput0;
            if (firstInput && firstInput[0]) firstInput[0].focus();
        });
    },
    beforeUnmount() {
        this.stopTimer();
    },
    computed: {
        isResendDisabled() {
            return this.timeLeft > 0 || this.submitting;
        }
    },
    methods: {
        startTimer(seconds) {
            this.timeLeft = seconds;
            if (this.timer) clearInterval(this.timer);
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                } else {
                    this.stopTimer();
                    // If the timer that just finished was the 300s one, redirect to login
                    if (seconds === 300) {
                        this.goBack();
                    }
                }
            }, 1000);
        },
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        async resendOTP() {
            if (this.isResendDisabled) return;
            
            this.submitting = true;
            this.errorMsg = null;
            
            try {
                await fetchApi('/otp/resend', {
                    method: 'POST',
                    body: { temp_token: this.tempToken }
                });
                
                this.otp = ['', '', '', '', '', ''];
                
                // Get next interval
                this.resendCount++;
                if (this.resendCount < this.resendIntervals.length) {
                    const nextInterval = this.resendIntervals[this.resendCount];
                    this.startTimer(nextInterval);
                } else {
                    // If we've exhausted resends, maybe redirect?
                    // But the requirement says "setelah 5 menit maka di lempar ke login"
                    // which is handled by the 300s timer ending.
                    this.goBack();
                }

                // Focus first input
                this.$nextTick(() => {
                    const firstInput = this.$refs.otpInput0;
                    if (firstInput && firstInput[0]) firstInput[0].focus();
                });
            } catch (err) {
                this.errorMsg = err.message || "Failed to resend OTP. Please try again.";
            } finally {
                this.submitting = false;
            }
        },
        handleInput(index, event) {
            this.errorMsg = null; // clear error on typing
            let value = event.target.value;
            
            // Allow only numbers
            value = value.replace(/[^0-9]/g, '');
            
            if (value) {
                this.otp[index] = value.charAt(0);
                // Move to next input
                if (index < 5) {
                    this.$nextTick(() => {
                        const nextInput = this.$refs['otpInput' + (index + 1)];
                        if (nextInput && nextInput[0]) nextInput[0].focus();
                    });
                } else if (index === 5) {
                    // Auto submit if last digit is filled
                    this.submitOTP();
                }
            } else {
                this.otp[index] = '';
            }
        },
        handleKeydown(index, event) {
            if (event.key === 'Backspace') {
                this.errorMsg = null;
                if (!this.otp[index] && index > 0) {
                    // Move to previous input if current is empty
                    this.otp[index - 1] = '';
                    this.$nextTick(() => {
                        const prevInput = this.$refs['otpInput' + (index - 1)];
                        if (prevInput && prevInput[0]) prevInput[0].focus();
                    });
                } else {
                    // Just clear current
                    this.otp[index] = '';
                }
            } else if (event.key === 'ArrowLeft' && index > 0) {
                const prevInput = this.$refs['otpInput' + (index - 1)];
                if (prevInput && prevInput[0]) prevInput[0].focus();
            } else if (event.key === 'ArrowRight' && index < 5) {
                const nextInput = this.$refs['otpInput' + (index + 1)];
                if (nextInput && nextInput[0]) nextInput[0].focus();
            }
        },
        handlePaste(event) {
            event.preventDefault();
            this.errorMsg = null;
            
            const pasteData = (event.clipboardData || window.clipboardData).getData('text');
            const numbers = pasteData.replace(/[^0-9]/g, '').slice(0, 6);
            
            for (let i = 0; i < numbers.length; i++) {
                this.otp[i] = numbers[i];
            }
            
            // Focus the input next to the last pasted digit, or the last one if 6 digits
            const nextFocusIndex = Math.min(numbers.length, 5);
            this.$nextTick(() => {
                const inputToFocus = this.$refs['otpInput' + nextFocusIndex];
                if (inputToFocus && inputToFocus[0]) {
                     inputToFocus[0].focus();
                }
                
                // Auto submit if 6 digits entered
                if (numbers.length === 6) {
                    this.submitOTP();
                }
            });
        },
        triggerPaste() {
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText()
                    .then(text => {
                        this.errorMsg = null;
                        const numbers = text.replace(/[^0-9]/g, '').slice(0, 6);
                        for (let i = 0; i < numbers.length; i++) {
                            this.otp[i] = numbers[i];
                        }
                        const nextFocusIndex = Math.min(numbers.length, 5);
                        this.$nextTick(() => {
                            const inputToFocus = this.$refs['otpInput' + nextFocusIndex];
                            if (inputToFocus && inputToFocus[0]) {
                                inputToFocus[0].focus();
                            }
                            
                            // Auto submit if 6 digits entered
                            if (numbers.length === 6) {
                                this.submitOTP();
                            }
                        });
                    })
                    .catch(err => {
                        console.error('Failed to read clipboard contents: ', err);
                        this.errorMsg = "Please use Ctrl+V / Cmd+V to paste.";
                    });
            } else {
                this.errorMsg = "Clipboard access not supported. Please paste manually.";
            }
        },
        async submitOTP() {
            const code = this.otp.join('');
            if (code.length < 6) {
                this.errorMsg = "Please enter the full 6-digit code.";
                return;
            }
            
            this.submitting = true;
            this.errorMsg = null;
            
            try {
                const response = await fetchApi('/otp/verify', {
                    method: 'POST',
                    body: {
                        temp_token: this.tempToken,
                        otp: code
                    }
                });
                    
                // Store permanent token
                const accessToken = response.data?.access_token;
                if (accessToken) {
                    localStorage.setItem('moon_office_token', accessToken);

                    // Pre-fetch permissions so Dashboard loads instantly with correct items
                    try {
                        const permResponse = await fetchApi('/me/permissions');
                        if (permResponse.success && permResponse.data) {
                            if (permResponse.data.features) {
                                const features = permResponse.data.features.map(f => f.name);
                                localStorage.setItem('moon_office_permissions', JSON.stringify(features));
                            }
                            if (permResponse.data.roles && permResponse.data.roles.length > 0) {
                                // Capitalize the first letter of the role (e.g. 'admin' -> 'Admin')
                                const primaryRole = permResponse.data.roles[0];
                                const formattedRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1);
                                localStorage.setItem('moon_office_role', formattedRole);
                            }
                        }
                    } catch (e) {
                         console.error('Failed to pre-fetch permissions:', e);
                    }

                    // Clear temp tokens
                    sessionStorage.removeItem('moon_office_temp_token');
                    
                    // Redirect to Dashboard
                    this.$router.push({ name: 'Dashboard' });
                } else {
                    throw new Error("Access token not received.");
                }
            } catch (err) {
                console.error('OTP verification failed:', err);
                this.errorMsg = err.message || "Invalid code. Please check and try again.";
            } finally {
                this.submitting = false;
            }
        },
        goBack() {
            this.$router.push('/login');
        }
    },
    template: `
        <div class="min-h-screen bg-login flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-md px-4">
                <!-- Transparent Card -->
                <div class="py-8 px-6 rounded-lg shadow-xl relative backdrop-blur-sm bg-white/5 text-center text-white">
                    
                    <h2 class="text-3xl font-bold mb-2">OTP Verification</h2>
                    <p class="text-sm mb-8 text-gray-200">Masukkan kode 6-digit yang dikirim ke WhatsApp Anda.</p>
                    
                    <div class="flex justify-center gap-2 sm:gap-4 mb-4">
                        <input
                            v-for="(digit, index) in otp"
                            :key="index"
                            :ref="'otpInput' + index"
                            type="text"
                            inputmode="numeric"
                            maxlength="1"
                            v-model="otp[index]"
                            :disabled="submitting"
                            @input="handleInput(index, $event)"
                            @keydown="handleKeydown(index, $event)"
                            @paste="handlePaste"
                            class="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-semibold bg-transparent border border-white/50 rounded-lg focus:outline-none focus:border-[#00DAB8] focus:ring-1 focus:ring-[#00DAB8] transition-colors text-white disabled:opacity-50"
                        />
                    </div>
                    
                    <button @click="triggerPaste" :disabled="submitting" class="text-sm text-[#00DAB8] hover:text-white transition-colors mb-6 disabled:opacity-50">
                        Paste
                    </button>
                    
                    <div class="mb-6 h-12 flex flex-col items-center justify-center">
                        <p v-if="errorMsg" class="text-red-500 font-medium mb-2 transition-opacity duration-300">
                            {{ errorMsg }}
                        </p>
                        
                        <p class="text-sm">
                            <span v-if="timeLeft > 0">OTP Can be Resend in <span class="text-[#00DAB8]">{{ timeLeft }}s</span>.</span>
                            <button v-else @click="resendOTP" :disabled="submitting" class="text-[#00DAB8] hover:text-white transition-colors font-medium disabled:opacity-50">Resend OTP Now</button>
                        </p>
                    </div>

                    <button @click="submitOTP" 
                        :disabled="submitting"
                        class="w-full flex justify-center py-3 px-4 mb-6 border border-transparent rounded shadow-sm text-sm font-bold text-white bg-[#00DAB8] hover:bg-[#1ABC9C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC9C] transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="submitting">Verifying...</span>
                        <span v-else>Submit</span>
                    </button>
                    
                    <button @click="goBack" class="text-sm font-medium hover:text-gray-300 transition-colors">
                        Back
                    </button>

                </div>
            </div>
        </div>
    `
}
