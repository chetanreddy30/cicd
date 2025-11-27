package com.ecommerce.klu.service;

import com.ecommerce.klu.model.Seller;
import com.ecommerce.klu.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SellerService {

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Seller> getAllSellers() {
        return sellerRepository.findAll();
    }

    public Optional<Seller> getSellerById(Long id) {
        return sellerRepository.findById(id);
    }

    public Optional<Seller> getSellerByUsername(String username) {
        return sellerRepository.findByUsername(username);
    }

    public Optional<Seller> getSellerByEmail(String email) {
        return sellerRepository.findByEmail(email);
    }

    public Optional<Seller> login(String email, String password) {
        Optional<Seller> sellerOpt = sellerRepository.findByEmail(email);
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            if (passwordEncoder.matches(password, seller.getPassword())) {
                return Optional.of(seller);
            }
        }
        return Optional.empty();
    }

    public Seller registerSeller(Seller seller) {
        seller.setRole("SELLER");
        if (seller.getPassword() != null) {
            seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        }
        return sellerRepository.save(seller);
    }

    public Seller createSeller(Seller seller) {
        if (seller.getPassword() != null) {
            seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        }
        return sellerRepository.save(seller);
    }

    public Seller updateSeller(Seller seller) {
        if (seller.getPassword() != null) {
            seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        }
        return sellerRepository.save(seller);
    }

    public void deleteSeller(Long id) {
        sellerRepository.deleteById(id);
    }

    public boolean existsByUsername(String username) {
        return sellerRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return sellerRepository.existsByEmail(email);
    }
}