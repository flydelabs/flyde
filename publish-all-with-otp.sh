# write a  bash script to prompt the user for a one-time password (OTP) and return it

function get_otp() {

    # read the OTP from the user
    read -p "Enter OTP: " otp

    # return the OTP
    echo $otp
}

yarn workspaces foreach -Avit --no-private npm publish --otp=$(get_otp) --access public --tolerate-republish
